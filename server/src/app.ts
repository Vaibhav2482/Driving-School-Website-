import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import type { Logger } from "pino";
import type { Env } from "./config/env.js";
import type { PrismaClient } from "./lib/prisma.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { httpLogger } from "./middleware/httpLogger.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { createRateLimiter } from "./middleware/rateLimit.js";
import { requestId } from "./middleware/requestId.js";
import { createApiRouter } from "./modules/index.js";
import { seoRouter } from "./modules/seo/seo.routes.js";
import { createServices, type AppServices } from "./services.js";

export interface AppDependencies {
  env: Env;
  logger: Logger;
  prisma: PrismaClient;
  /** Pre-built services (server.ts builds them so the worker can share the notification service). */
  services?: AppServices;
}

/**
 * Build the Express application. Everything it needs is passed in, so tests can create an app
 * with a stub database and a silent logger, and nothing here reads process.env.
 */
export function createApp({ env, logger, prisma, services: provided }: AppDependencies): Express {
  const app = express();
  const services = provided ?? createServices({ env, logger, prisma });

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(requestId);
  app.use(httpLogger(logger));
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "X-SSB-Client"],
      exposedHeaders: ["X-Request-Id"],
      maxAge: 600,
    }),
  );
  // Rate limiting runs before body parsing so abusive clients are rejected cheaply.
  app.use(createRateLimiter({ windowMs: 15 * 60 * 1000, limit: env.RATE_LIMIT_MAX }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.use("/api/v1", createApiRouter({ env, logger, prisma, services }));
  // Crawler files live at the site root, outside the versioned API.
  app.use(seoRouter({ env, logger, prisma }));

  app.use(notFoundHandler);
  app.use(errorHandler(logger));

  return app;
}
