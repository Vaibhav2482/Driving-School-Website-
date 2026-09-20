import type { Env } from "../../config/env.js";
import { canCreateRole } from "../../config/permissions.js";
import type { AuditLogger } from "../../lib/audit.js";
import { AppError } from "../../lib/errors.js";
import { unusablePasswordHash, type PasswordHasher } from "../../lib/passwords.js";
import type { PrismaClient } from "../../lib/prisma.js";
import type { AuthContext } from "../../middleware/authenticate.js";
import {
  buildLink,
  createOneTimeToken,
  INVITE_TTL_MS,
  INVITE_VALID_FOR,
} from "../auth/one-time-tokens.js";
import type { RequestMeta } from "../auth/session.service.js";
import type { NotificationService } from "../notifications/notification.service.js";
import type { CreateUserInput } from "./users.schemas.js";

export type UsersPrisma = Pick<
  PrismaClient,
  "user" | "branch" | "student" | "instructor" | "authToken" | "auditLog" | "$transaction"
>;

export interface UsersServiceDeps {
  prisma: UsersPrisma;
  env: Env;
  hasher: PasswordHasher;
  audit: AuditLogger;
  notifications: Pick<NotificationService, "enqueueAndSend">;
  clock: () => Date;
}

export type UsersService = ReturnType<typeof createUsersService>;

export function createUsersService({
  prisma,
  env,
  hasher,
  audit,
  notifications,
  clock,
}: UsersServiceDeps) {
  return {
    /**
     * Create an account and invite the person to set their own password. There are no self-registered
     * users and no emailed passwords: the invitee follows a single-use link.
     *
     * The caller's role is read from the authenticated session (never from the request), and the
     * privilege-escalation rules in `CREATABLE_ROLES` are applied here, on the server.
     */
    async create(actor: AuthContext, input: CreateUserInput, meta: RequestMeta) {
      if (!canCreateRole(actor.role, input.role)) {
        await audit.record({
          actorId: actor.userId,
          action: "user.create_denied",
          entity: "User",
          after: { attemptedRole: input.role, actorRole: actor.role },
          ipAddress: meta.ip,
        });
        throw AppError.forbidden("You cannot create users with this role.");
      }

      const needsBranch = input.role === "STUDENT" || input.role === "INSTRUCTOR";
      if (needsBranch) {
        const branch = await prisma.branch.findFirst({
          where: { id: input.branchId, isActive: true },
          select: { id: true },
        });
        if (!branch)
          throw AppError.validation([
            { path: "body.branchId", message: "Please choose a valid branch." },
          ]);
      }

      const now = clock();
      // The person cannot sign in until they follow the invitation and choose their own password.
      const passwordHash = await unusablePasswordHash(hasher);

      const { user, invite } = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: input.email ?? null,
            phone: input.phone ?? null,
            fullName: input.fullName,
            role: input.role,
            passwordHash,
            mustChangePassword: false,
          },
          select: { id: true, fullName: true, role: true, email: true, phone: true },
        });
        if (input.role === "STUDENT" && input.branchId) {
          await tx.student.create({ data: { userId: created.id, branchId: input.branchId } });
        }
        if (input.role === "INSTRUCTOR" && input.branchId) {
          await tx.instructor.create({ data: { userId: created.id, branchId: input.branchId } });
        }
        const token = await createOneTimeToken(tx, created.id, "INVITE", INVITE_TTL_MS, now);
        return { user: created, invite: token };
      });

      const link = buildLink(env.clientOrigin, "/auth/accept-invite", invite.token);
      if (user.email) {
        await notifications.enqueueAndSend({
          template: "account.invite",
          recipient: user.email,
          userId: user.id,
          payload: { name: user.fullName, link, validFor: INVITE_VALID_FOR },
        });
      }

      await audit.record({
        actorId: actor.userId,
        action: "user.created",
        entity: "User",
        entityId: user.id,
        after: { role: user.role },
        ipAddress: meta.ip,
      });

      return {
        user: {
          id: user.id,
          name: user.fullName,
          role: user.role,
          email: user.email,
          phone: user.phone,
        },
        invite: {
          emailed: Boolean(user.email),
          expiresAt: invite.expiresAt.toISOString(),
          // With no email address there is no other way to deliver the link (for example a student who only
          // has a phone), so the creating staff member gets it once, to share themselves. It is otherwise
          // never returned.
          ...(user.email ? {} : { link }),
        },
      };
    },
  };
}
