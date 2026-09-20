import type { Logger } from "pino";
import type { Env } from "../../config/env.js";
import { permissionsFor } from "../../config/permissions.js";
import type { Role } from "../../generated/prisma/enums.js";
import type { AuditLogger } from "../../lib/audit.js";
import { AppError } from "../../lib/errors.js";
import { checkPasswordPolicy, type PasswordHasher } from "../../lib/passwords.js";
import type { PrismaClient } from "../../lib/prisma.js";
import { normalizeIndianMobile } from "../../lib/text.js";
import { hashToken } from "../../lib/tokens.js";
import type { NotificationService } from "../notifications/notification.service.js";
import type { AuthenticatedUser } from "./auth.types.js";
import { buildLink, createOneTimeToken, RESET_TTL_MS, RESET_VALID_FOR } from "./one-time-tokens.js";
import type { RequestMeta, SessionService } from "./session.service.js";

export type AuthPrisma = Pick<
  PrismaClient,
  "user" | "refreshToken" | "authToken" | "auditLog" | "$transaction"
>;

/** Failed logins before an account is locked for LOCK_MS. */
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MS = 15 * 60_000;

interface UserRow {
  id: string;
  role: Role;
  fullName: string;
  email: string | null;
  phone: string | null;
  mustChangePassword: boolean;
}

/** Only fields that are safe to send to the browser: never the password hash or security counters. */
export function toAuthenticatedUser(user: UserRow): AuthenticatedUser {
  return {
    id: user.id,
    role: user.role,
    name: user.fullName,
    email: user.email,
    phone: user.phone,
    mustChangePassword: user.mustChangePassword,
    permissions: permissionsFor(user.role),
  };
}

/** "email or mobile number" → the unique column to look up, or null if it is neither. */
export function parseLoginIdentifier(raw: string): { email: string } | { phone: string } | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.includes("@")) return { email: value.toLowerCase() };
  const phone = normalizeIndianMobile(value);
  return phone ? { phone } : null;
}

export interface AuthServiceDeps {
  prisma: AuthPrisma;
  env: Env;
  logger: Logger;
  hasher: PasswordHasher;
  sessions: SessionService;
  audit: AuditLogger;
  notifications: Pick<NotificationService, "enqueueAndSend">;
  clock: () => Date;
}

export type AuthService = ReturnType<typeof createAuthService>;

export function createAuthService(deps: AuthServiceDeps) {
  const { prisma, env, hasher, sessions, audit, notifications, clock } = deps;

  const passwordProblem = (path: "currentPassword" | "newPassword" | "password", message: string) =>
    AppError.validation([{ path: `body.${path}`, message }]);

  /** Enforce the password policy for a specific account (also forbids using their own email/phone). */
  function assertPasswordAllowed(
    password: string,
    user: { email: string | null; phone: string | null },
    field: "newPassword" | "password",
  ) {
    const [problem] = checkPasswordPolicy(password, user);
    if (problem) throw passwordProblem(field, problem);
  }

  // ── Login ───────────────────────────────────────────────────────────────────────────────────
  async function login(input: { identifier: string; password: string }, meta: RequestMeta) {
    const now = clock();
    const lookup = parseLoginIdentifier(input.identifier);
    const user = lookup
      ? await prisma.user.findFirst({ where: { ...lookup, deletedAt: null } })
      : null;

    if (!user) {
      // Same amount of work as a real check, and the same answer, so an attacker learns nothing.
      await hasher.verifyAgainstDummy(input.password);
      await audit.record({
        action: "auth.login_failed",
        entity: "User",
        after: { reason: "unknown_account" },
        ipAddress: meta.ip,
      });
      throw AppError.invalidCredentials();
    }

    // Always verify, even for locked or inactive accounts, so timing does not reveal their state.
    const passwordOk = await hasher.verify(input.password, user.passwordHash);
    const locked = user.lockedUntil !== null && user.lockedUntil.getTime() > now.getTime();

    if (!passwordOk || locked || !user.isActive) {
      if (!passwordOk && !locked && user.isActive) {
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginCount: { increment: 1 } },
          select: { failedLoginCount: true },
        });
        if (updated.failedLoginCount >= MAX_FAILED_LOGINS) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lockedUntil: new Date(now.getTime() + LOCK_MS), failedLoginCount: 0 },
          });
          await audit.record({
            actorId: user.id,
            action: "auth.account_locked",
            entity: "User",
            entityId: user.id,
            ipAddress: meta.ip,
          });
        }
      }
      await audit.record({
        actorId: user.id,
        action: "auth.login_failed",
        entity: "User",
        entityId: user.id,
        after: { reason: !user.isActive ? "inactive" : locked ? "locked" : "bad_password" },
        ipAddress: meta.ip,
      });
      throw AppError.invalidCredentials();
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now },
    });
    const session = await sessions.issue(user, meta);
    await audit.record({
      actorId: user.id,
      action: "auth.login",
      entity: "User",
      entityId: user.id,
      ipAddress: meta.ip,
    });
    return { user: toAuthenticatedUser(user), session };
  }

  // ── Refresh / logout / me ───────────────────────────────────────────────────────────────────
  async function refresh(refreshToken: string | undefined, meta: RequestMeta) {
    const { user, session } = await sessions.rotate(refreshToken, meta);
    return { user: toAuthenticatedUser(user), session };
  }

  async function logout(refreshToken: string | undefined, meta: RequestMeta) {
    const ended = await sessions.logout(refreshToken);
    if (ended) {
      await audit.record({
        actorId: ended.userId,
        action: "auth.logout",
        entity: "User",
        entityId: ended.userId,
        ipAddress: meta.ip,
      });
    }
  }

  async function me(userId: string): Promise<AuthenticatedUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive || user.deletedAt) throw AppError.unauthenticated();
    return toAuthenticatedUser(user);
  }

  // ── Password change (signed in) ─────────────────────────────────────────────────────────────
  async function changePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string },
    meta: RequestMeta,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive || user.deletedAt) throw AppError.unauthenticated();

    // A wrong CURRENT password is a validation problem (400), not a 401: a 401 would make the web app
    // think its session expired and sign the person out.
    if (!(await hasher.verify(input.currentPassword, user.passwordHash))) {
      await audit.record({
        actorId: user.id,
        action: "auth.password_change_failed",
        entity: "User",
        entityId: user.id,
        ipAddress: meta.ip,
      });
      throw passwordProblem("currentPassword", "Your current password is not correct.");
    }
    if (input.newPassword === input.currentPassword) {
      throw passwordProblem(
        "newPassword",
        "Choose a password that is different from your current one.",
      );
    }
    assertPasswordAllowed(input.newPassword, user, "newPassword");

    const passwordHash = await hasher.hash(input.newPassword);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash, mustChangePassword: false },
      });
      await sessions.revokeAllForUser(user.id, tx); // every other device is signed out
    });

    const session = await sessions.issue(user, meta); // this device stays signed in
    await audit.record({
      actorId: user.id,
      action: "auth.password_changed",
      entity: "User",
      entityId: user.id,
      ipAddress: meta.ip,
    });
    return { user: toAuthenticatedUser({ ...user, mustChangePassword: false }), session };
  }

  // ── Forgot / reset password ─────────────────────────────────────────────────────────────────
  /**
   * Start a password reset. The caller answers the visitor with the SAME generic message whether or
   * not the account exists, and this work should run after that response is sent.
   */
  async function requestPasswordReset(email: string, meta: RequestMeta): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null, isActive: true },
    });
    if (!user?.email) return;

    const { token } = await createOneTimeToken(
      prisma,
      user.id,
      "PASSWORD_RESET",
      RESET_TTL_MS,
      clock(),
    );
    await notifications.enqueueAndSend({
      template: "account.password-reset",
      recipient: user.email,
      userId: user.id,
      payload: {
        name: user.fullName,
        link: buildLink(env.clientOrigin, "/auth/reset-password", token),
        validFor: RESET_VALID_FOR,
      },
    });
    await audit.record({
      actorId: user.id,
      action: "auth.password_reset_requested",
      entity: "User",
      entityId: user.id,
      ipAddress: meta.ip,
    });
  }

  /** Look up a usable one-time token, or throw the same generic error for every kind of failure. */
  async function findUsableToken(token: string, type: "PASSWORD_RESET" | "INVITE") {
    const record = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
    const now = clock();
    if (
      !record ||
      record.type !== type ||
      record.usedAt ||
      record.expiresAt.getTime() <= now.getTime()
    ) {
      throw AppError.invalidToken();
    }
    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || !user.isActive || user.deletedAt) throw AppError.invalidToken();
    return { record, user };
  }

  /** Spend the token and set the password in one transaction; only one request can win. */
  async function consumeTokenAndSetPassword(
    record: { id: string; userId: string },
    passwordHash: string,
    now: Date,
  ) {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.authToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) throw AppError.invalidToken(); // used a moment ago by someone else
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash, mustChangePassword: false, failedLoginCount: 0, lockedUntil: null },
      });
      await sessions.revokeAllForUser(record.userId, tx);
    });
  }

  async function resetPassword(input: { token: string; newPassword: string }, meta: RequestMeta) {
    const { record, user } = await findUsableToken(input.token, "PASSWORD_RESET");
    // Check the password BEFORE spending the link, so a weak choice does not waste it.
    assertPasswordAllowed(input.newPassword, user, "newPassword");
    await consumeTokenAndSetPassword(record, await hasher.hash(input.newPassword), clock());
    await audit.record({
      actorId: user.id,
      action: "auth.password_reset",
      entity: "User",
      entityId: user.id,
      ipAddress: meta.ip,
    });
  }

  async function acceptInvite(input: { token: string; password: string }, meta: RequestMeta) {
    const { record, user } = await findUsableToken(input.token, "INVITE");
    assertPasswordAllowed(input.password, user, "password");
    await consumeTokenAndSetPassword(record, await hasher.hash(input.password), clock());
    await audit.record({
      actorId: user.id,
      action: "auth.invite_accepted",
      entity: "User",
      entityId: user.id,
      ipAddress: meta.ip,
    });
  }

  return {
    login,
    refresh,
    logout,
    me,
    changePassword,
    requestPasswordReset,
    resetPassword,
    acceptInvite,
  };
}
