import type { CookieOptions, Request, Response } from "express";
import type { Env } from "../../config/env.js";

/** Where the refresh cookie is sent: only to the auth endpoints, never with ordinary API calls. */
const COOKIE_PATH = "/api/v1/auth";

/** In production the `__Secure-` prefix makes browsers refuse the cookie unless it is Secure. */
export const refreshCookieName = (env: Pick<Env, "isProduction">) =>
  env.isProduction ? "__Secure-ssb_refresh" : "ssb_refresh";

function options(env: Pick<Env, "isProduction">): CookieOptions {
  return {
    httpOnly: true, // JavaScript can never read it
    secure: env.isProduction, // HTTPS only in production (browsers accept it on localhost in development)
    sameSite: "strict", // never sent on cross-site requests
    path: COOKIE_PATH,
  };
}

export function setRefreshCookie(
  res: Response,
  env: Pick<Env, "isProduction" | "REFRESH_TOKEN_TTL_DAYS">,
  token: string,
) {
  res.cookie(refreshCookieName(env), token, {
    ...options(env),
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
  });
}

export function clearRefreshCookie(res: Response, env: Pick<Env, "isProduction">) {
  res.clearCookie(refreshCookieName(env), options(env));
}

export function readRefreshCookie(
  req: Request,
  env: Pick<Env, "isProduction">,
): string | undefined {
  const value: unknown = (req.cookies as Record<string, unknown> | undefined)?.[
    refreshCookieName(env)
  ];
  return typeof value === "string" && value.length > 0 && value.length < 512 ? value : undefined;
}
