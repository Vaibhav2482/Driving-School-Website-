import { Router } from "express";
import { AppError } from "../../lib/errors.js";
import type { PrismaClient } from "../../lib/prisma.js";
import { sendData } from "../../lib/response.js";

export interface HealthDependencies {
  prisma: Pick<PrismaClient, "$queryRaw">;
}

/**
 * GET /api/v1/health        Liveness: the process is up. Never touches the database.
 * GET /api/v1/health/ready  Readiness: the database answers. 503 if it does not.
 *
 * Neither endpoint returns configuration, versions, hostnames or connection details.
 */
export function healthRouter({ prisma }: HealthDependencies): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    sendData(res, { status: "ok" });
  });

  router.get("/ready", async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      req.log.error({ err }, "Readiness check failed: database unreachable");
      throw AppError.unavailable("The database is not reachable.");
    }
    sendData(res, { status: "ok", database: "up" });
  });

  return router;
}
