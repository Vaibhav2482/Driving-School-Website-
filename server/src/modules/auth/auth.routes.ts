import { Router, type RequestHandler } from "express";
import type { Logger } from "pino";
import type { Env } from "../../config/env.js";
import { createRateLimiter } from "../../middleware/rateLimit.js";
import { requireTrustedOrigin } from "../../middleware/trustedOrigin.js";
import { validate } from "../../middleware/validate.js";
import {
  acceptInviteBodySchema,
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  resetPasswordBodySchema,
} from "./auth.schemas.js";
import { createAuthController } from "./auth.controller.js";
import type { AuthService } from "./auth.service.js";

export interface AuthRouterDeps {
  env: Env;
  logger: Logger;
  authService: AuthService;
  authenticate: RequestHandler;
}

/** Responses here carry tokens or account state: they must never be cached by browsers or proxies. */
const noStore: RequestHandler = (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
};

const FIFTEEN_MINUTES = 15 * 60_000;
const ONE_HOUR = 60 * 60_000;

/**
 * /api/v1/auth. Which endpoints are protected by what:
 *  - login, refresh, logout: trusted-origin check (they set or use the refresh cookie);
 *  - login and change-password: rate limited on FAILURES only, so normal users are never blocked;
 *  - forgot/reset/accept-invite: strict hourly limits;
 *  - me, change-password: valid access token. They deliberately do NOT use `requirePermission`, so they
 *    keep working while a forced password change is pending.
 */
export function authRouter({ env, logger, authService, authenticate }: AuthRouterDeps) {
  const controller = createAuthController(authService, env, logger);
  const trustedOrigin = requireTrustedOrigin(env);
  const failedAttemptLimiter = createRateLimiter({
    windowMs: FIFTEEN_MINUTES,
    limit: env.LOGIN_RATE_LIMIT_MAX,
    skipSuccessfulRequests: true,
  });
  const resetLimiter = createRateLimiter({
    windowMs: ONE_HOUR,
    limit: env.PASSWORD_RESET_RATE_LIMIT_MAX,
  });

  const router = Router();
  router.use(noStore);

  router.post(
    "/login",
    failedAttemptLimiter,
    trustedOrigin,
    validate({ body: loginBodySchema }),
    controller.login,
  );
  router.post("/refresh", trustedOrigin, controller.refresh);
  router.post("/logout", trustedOrigin, controller.logout);

  router.get("/me", authenticate, controller.me);
  router.post(
    "/change-password",
    authenticate,
    failedAttemptLimiter,
    validate({ body: changePasswordBodySchema }),
    controller.changePassword,
  );

  router.post(
    "/forgot-password",
    resetLimiter,
    validate({ body: forgotPasswordBodySchema }),
    controller.forgotPassword,
  );
  router.post(
    "/reset-password",
    resetLimiter,
    validate({ body: resetPasswordBodySchema }),
    controller.resetPassword,
  );
  router.post(
    "/accept-invite",
    resetLimiter,
    validate({ body: acceptInviteBodySchema }),
    controller.acceptInvite,
  );

  return router;
}
