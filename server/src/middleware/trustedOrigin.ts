import type { RequestHandler } from "express";
import type { Env } from "../config/env.js";
import { AppError } from "../lib/errors.js";

export const CLIENT_HEADER = "x-ssb-client";
export const CLIENT_HEADER_VALUE = "web";

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function isTrustedOrigin(
  origin: string,
  env: Pick<Env, "clientOrigin" | "isProduction">,
): boolean {
  if (origin === env.clientOrigin) return true;
  return !env.isProduction && LOCAL_ORIGIN.test(origin); // any local dev port
}

/**
 * CSRF defence for endpoints that set or use the refresh cookie (login, refresh, logout).
 * Layers: the cookie is SameSite=Strict; the request must carry a custom header, which browsers will not
 * add to a cross-site form post and only allow cross-origin after a CORS preflight; and if an `Origin`
 * header is present it must be our own web app.
 */
export function requireTrustedOrigin(
  env: Pick<Env, "clientOrigin" | "isProduction">,
): RequestHandler {
  return (req, _res, next) => {
    if (req.get(CLIENT_HEADER) !== CLIENT_HEADER_VALUE)
      throw AppError.forbidden("This request is not allowed.");
    const origin = req.get("origin");
    if (origin && !isTrustedOrigin(origin, env))
      throw AppError.forbidden("This request is not allowed.");
    next();
  };
}
