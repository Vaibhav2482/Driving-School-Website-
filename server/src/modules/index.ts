import { Router } from "express";
import type { Logger } from "pino";
import type { Env } from "../config/env.js";
import type { PrismaClient } from "../lib/prisma.js";
import type { AppServices } from "../services.js";
import { authRouter } from "./auth/auth.routes.js";
import { healthRouter } from "./health/health.routes.js";
import { instructorsRouter } from "./instructors/instructors.routes.js";
import { publicRouter } from "./public/public.routes.js";
import { studentsRouter } from "./students/students.routes.js";
import { usersRouter } from "./users/users.routes.js";

export interface ApiDependencies {
  env: Env;
  logger: Logger;
  prisma: PrismaClient;
  services: AppServices;
}

/**
 * The /api/v1 router. Each feature module exposes a `xxxRouter(deps)` factory and is mounted here
 * with a single line, so adding a module never touches app.ts.
 *
 * PUBLIC (no login): health, public, auth (login and friends).
 * PROTECTED: users, students, instructors. Each of these routers starts with `router.use(authenticate)`,
 * so a route added later is authenticated by default, and must then declare `requirePermission(...)`.
 *
 * Planned (see docs/architecture.md): packages, enquiries, enrollments, bookings, lessons, payments, rta,
 * reviews, notifications, settings, reports, vehicles. They are added in their own phases.
 */
export function createApiRouter({ env, logger, prisma, services }: ApiDependencies): Router {
  const router = Router();
  router.use("/health", healthRouter({ prisma }));
  router.use(
    "/public",
    publicRouter({
      env,
      logger,
      prisma,
      notifications: services.notifications,
      clock: services.clock,
    }),
  );
  router.use(
    "/auth",
    authRouter({
      env,
      logger,
      authService: services.authService,
      authenticate: services.authenticate,
    }),
  );

  router.use(
    "/users",
    usersRouter({ authenticate: services.authenticate, usersService: services.usersService }),
  );
  router.use("/students", studentsRouter({ authenticate: services.authenticate, prisma }));
  router.use("/instructors", instructorsRouter({ authenticate: services.authenticate, prisma }));
  return router;
}
