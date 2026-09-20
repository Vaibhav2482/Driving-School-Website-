import type { RequestHandler } from "express";
import type { Logger } from "pino";
import type { Env } from "./config/env.js";
import { createEmailProvider, type EmailProvider } from "./integrations/email/email-provider.js";
import { createAuditLogger, type AuditLogger } from "./lib/audit.js";
import { createPasswordHasher, type PasswordHasher } from "./lib/passwords.js";
import type { PrismaClient } from "./lib/prisma.js";
import { createAuthenticate } from "./middleware/authenticate.js";
import { createAuthService, type AuthService } from "./modules/auth/auth.service.js";
import { createSessionService, type SessionService } from "./modules/auth/session.service.js";
import {
  createNotificationService,
  type NotificationService,
} from "./modules/notifications/notification.service.js";
import { createUsersService, type UsersService } from "./modules/users/users.service.js";

/** Long-lived collaborators, wired once. Anything here can be replaced in tests via `overrides`. */
export interface AppServices {
  clock: () => Date;
  hasher: PasswordHasher;
  audit: AuditLogger;
  emailProvider: EmailProvider;
  notifications: NotificationService;
  sessions: SessionService;
  authService: AuthService;
  usersService: UsersService;
  authenticate: RequestHandler;
}

export type ServiceOverrides = Partial<
  Pick<AppServices, "clock" | "hasher" | "emailProvider" | "notifications">
>;

export function createServices(
  { env, logger, prisma }: { env: Env; logger: Logger; prisma: PrismaClient },
  overrides: ServiceOverrides = {},
): AppServices {
  const clock = overrides.clock ?? (() => new Date());
  const hasher = overrides.hasher ?? createPasswordHasher(env.PASSWORD_HASH_COST);
  const audit = createAuditLogger(prisma, logger);
  const emailProvider = overrides.emailProvider ?? createEmailProvider(env, logger);
  const notifications =
    overrides.notifications ??
    createNotificationService({ prisma, logger, env, emailProvider, clock });
  const sessions = createSessionService({ prisma, env, audit, clock });
  const authService = createAuthService({
    prisma,
    env,
    logger,
    hasher,
    sessions,
    audit,
    notifications,
    clock,
  });
  const usersService = createUsersService({ prisma, env, hasher, audit, notifications, clock });
  const authenticate = createAuthenticate({ env, prisma, clock });
  return {
    clock,
    hasher,
    audit,
    emailProvider,
    notifications,
    sessions,
    authService,
    usersService,
    authenticate,
  };
}
