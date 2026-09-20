import { Router, type RequestHandler } from "express";
import type { Logger } from "pino";
import type { Env } from "../../config/env.js";
import type { PrismaClient } from "../../lib/prisma.js";
import { sendData } from "../../lib/response.js";
import { createRateLimiter } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import type { NotificationService } from "../notifications/notification.service.js";
import { createCatalogService } from "./catalog.service.js";
import { createEnquiryService } from "./enquiries.service.js";
import { createPublicController } from "./public.controller.js";
import { createEnquirySchema, slugParamsSchema } from "./public.schemas.js";

export interface PublicDependencies {
  env: Env;
  logger: Logger;
  prisma: PrismaClient;
  notifications: Pick<NotificationService, "notifyOwnerOfEnquiry">;
  /** The application clock (injectable in tests). */
  clock?: () => Date;
}

/** Public reads change rarely: let browsers and CDNs reuse them briefly. */
const publicCache: RequestHandler = (_req, res, next) => {
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  next();
};

/**
 * Bots fill every field they can find. The form contains a hidden `website` input that humans never
 * see, so a value in it means automation. We answer with the normal success response (so the bot
 * learns nothing) but store nothing.
 */
function honeypot(logger: Logger): RequestHandler {
  return (req, res, next) => {
    const trap: unknown = (req.body as Record<string, unknown> | undefined)?.website;
    if (typeof trap === "string" && trap.trim() !== "") {
      logger.info({ requestId: req.id }, "Enquiry honeypot triggered; submission discarded");
      sendData(res, { received: true }, { status: 201 });
      return;
    }
    next();
  };
}

/**
 * Public, unauthenticated API for the marketing website (`/api/v1/public`). Only fields intended for
 * display are returned; see `catalog.service.ts`.
 */
export function publicRouter({
  env,
  logger,
  prisma,
  notifications,
  clock,
}: PublicDependencies): Router {
  const catalog = createCatalogService(prisma);
  const controller = createPublicController(
    catalog,
    createEnquiryService(prisma, notifications, clock),
  );
  const enquirySchema = createEnquirySchema(env.BUSINESS_TIMEZONE);

  const enquiryLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    limit: env.ENQUIRY_RATE_LIMIT_MAX,
  });

  const router = Router();

  router.get("/packages", publicCache, controller.listPackages);
  router.get(
    "/packages/:slug",
    publicCache,
    validate({ params: slugParamsSchema }),
    controller.getPackage,
  );
  router.get("/branches", publicCache, controller.listBranches);
  router.get("/settings", publicCache, controller.getSettings);
  router.get("/rta-services", publicCache, controller.listRtaServices);
  router.get("/reviews", publicCache, controller.listReviews);

  router.post(
    "/enquiries",
    enquiryLimiter,
    honeypot(logger),
    validate({ body: enquirySchema }),
    controller.createEnquiry(enquirySchema),
  );

  return router;
}
