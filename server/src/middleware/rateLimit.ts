import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { AppError } from "../lib/errors.js";

export interface RateLimiterOptions {
  windowMs: number;
  /** Maximum requests per client IP within the window. */
  limit: number;
  /** Count only failed requests (status >= 400). Used for login so ordinary users are never limited. */
  skipSuccessfulRequests?: boolean;
}

/**
 * Per-IP rate limiter that reports through the normal error envelope (429 RATE_LIMITED).
 * The in-memory store is fine for a single API process; move to a shared store if we ever scale out.
 * Stricter limiters (login, password reset, the public enquiry form) are built from this factory.
 */
export function createRateLimiter({
  windowMs,
  limit,
  skipSuccessfulRequests = false,
}: RateLimiterOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (_req, _res, next) => next(AppError.tooManyRequests()),
  });
}
