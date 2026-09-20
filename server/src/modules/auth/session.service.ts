import type { Env } from "../../config/env.js";
import type { Role } from "../../generated/prisma/enums.js";
import type { AuditLogger } from "../../lib/audit.js";
import { AppError } from "../../lib/errors.js";
import type { PrismaClient } from "../../lib/prisma.js";
import { generateOpaqueToken, hashToken, newFamilyId, signAccessToken } from "../../lib/tokens.js";

export type SessionPrisma = Pick<PrismaClient, "refreshToken" | "user" | "$transaction">;
/** Either the client or a transaction client: anything with a refreshToken delegate. */
type RefreshTokenClient = Pick<PrismaClient, "refreshToken">;

export interface RequestMeta {
  ip?: string | null;
  userAgent?: string | null;
}

/** The parts of a user needed to start or continue a session. */
export interface SessionUser {
  id: string;
  role: Role;
}

export interface IssuedSession {
  /** Short-lived JWT, returned in the JSON body and kept in memory by the web app. */
  accessToken: string;
  accessTokenExpiresIn: number;
  /** Opaque token for the httpOnly cookie ONLY. Never put this in a response body or a log. */
  refreshToken: string;
}

/**
 * A second refresh presented within this window of the first one (same, now-rotated token) is a
 * harmless race (two tabs, or a retry), not theft. It is answered with 409 so the client retries with
 * the cookie the winning request just set. Anything later is treated as token reuse.
 */
const CONCURRENT_REFRESH_GRACE_MS = 10_000;

export type SessionService = ReturnType<typeof createSessionService>;

export interface SessionServiceDeps {
  prisma: SessionPrisma;
  env: Env;
  audit: AuditLogger;
  clock: () => Date;
}

export function createSessionService({ prisma, env, audit, clock }: SessionServiceDeps) {
  const refreshTtlMs = () => env.REFRESH_TOKEN_TTL_DAYS * 86_400_000;
  const trimAgent = (agent: string | null | undefined) => (agent ? agent.slice(0, 200) : null);

  function buildAccessToken(user: SessionUser, familyId: string, now: Date) {
    return signAccessToken(env, { sub: user.id, role: user.role, sid: familyId }, now);
  }

  /** Start a brand-new session (a new refresh-token family), e.g. at login. */
  async function issue(user: SessionUser, meta: RequestMeta): Promise<IssuedSession> {
    const now = clock();
    const familyId = newFamilyId();
    const refreshToken = generateOpaqueToken();
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        familyId,
        expiresAt: new Date(now.getTime() + refreshTtlMs()),
        userAgent: trimAgent(meta.userAgent),
      },
    });
    const access = buildAccessToken(user, familyId, now);
    return {
      accessToken: access.token,
      accessTokenExpiresIn: access.expiresInSeconds,
      refreshToken,
    };
  }

  /** Revoke every still-active token in one login session. */
  async function revokeFamily(
    familyId: string,
    client: RefreshTokenClient = prisma,
  ): Promise<void> {
    await client.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: clock() },
    });
  }

  /** Revoke every session a user has (password change/reset). */
  async function revokeAllForUser(
    userId: string,
    client: RefreshTokenClient = prisma,
  ): Promise<void> {
    await client.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: clock() },
    });
  }

  /** A revoked token was presented: decide between a benign race and real reuse. */
  async function handleRevokedToken(
    record: {
      userId: string;
      familyId: string;
      revokedAt: Date | null;
      replacedById: string | null;
    },
    meta: RequestMeta,
  ): Promise<never> {
    const now = clock();
    if (
      record.replacedById &&
      record.revokedAt &&
      now.getTime() - record.revokedAt.getTime() < CONCURRENT_REFRESH_GRACE_MS
    ) {
      const successor = await prisma.refreshToken.findUnique({
        where: { id: record.replacedById },
        select: { revokedAt: true },
      });
      if (successor && successor.revokedAt === null) throw AppError.refreshRace();
    }

    // Reuse of a token that was already rotated or revoked: assume it may have been stolen.
    // Kill the whole login session so both the attacker and the real user must sign in again.
    await revokeFamily(record.familyId);
    await audit.record({
      actorId: record.userId,
      action: "auth.refresh_reuse_detected",
      entity: "User",
      entityId: record.userId,
      ipAddress: meta.ip,
    });
    throw AppError.sessionInvalid();
  }

  /**
   * Exchange a refresh token for a new one (rotation).
   * The old token is revoked and a successor is created in the SAME family, atomically, so exactly one
   * of several simultaneous requests can win.
   */
  async function rotate(plainToken: string | undefined, meta: RequestMeta) {
    if (!plainToken) throw AppError.sessionInvalid();
    const tokenHash = hashToken(plainToken);
    const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record) throw AppError.sessionInvalid();

    if (record.revokedAt) return handleRevokedToken(record, meta);

    const now = clock();
    if (record.expiresAt.getTime() <= now.getTime()) {
      await revokeFamily(record.familyId);
      throw AppError.sessionInvalid();
    }

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || !user.isActive || user.deletedAt) {
      await revokeFamily(record.familyId);
      throw AppError.sessionInvalid();
    }

    const nextToken = generateOpaqueToken();
    const won = await prisma.$transaction(async (tx) => {
      const claimed = await tx.refreshToken.updateMany({
        where: { id: record.id, revokedAt: null },
        data: { revokedAt: now },
      });
      if (claimed.count !== 1) return false; // someone else rotated it a moment ago
      const successor = await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(nextToken),
          familyId: record.familyId,
          expiresAt: new Date(now.getTime() + refreshTtlMs()),
          userAgent: trimAgent(meta.userAgent),
        },
        select: { id: true },
      });
      await tx.refreshToken.update({
        where: { id: record.id },
        data: { replacedById: successor.id },
      });
      return true;
    });

    if (!won) {
      const fresh = await prisma.refreshToken.findUnique({ where: { tokenHash } });
      return handleRevokedToken(fresh ?? record, meta);
    }

    const access = buildAccessToken(user, record.familyId, now);
    const session: IssuedSession = {
      accessToken: access.token,
      accessTokenExpiresIn: access.expiresInSeconds,
      refreshToken: nextToken,
    };
    return { user, session };
  }

  /** End the session the presented refresh token belongs to. Always succeeds; unknown tokens are ignored. */
  async function logout(plainToken: string | undefined): Promise<{ userId: string } | null> {
    if (!plainToken) return null;
    const record = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(plainToken) },
      select: { userId: true, familyId: true },
    });
    if (!record) return null;
    await revokeFamily(record.familyId);
    return { userId: record.userId };
  }

  return { issue, rotate, logout, revokeFamily, revokeAllForUser };
}
