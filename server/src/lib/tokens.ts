import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import type { Env } from "../config/env.js";
import type { Role } from "../generated/prisma/enums.js";
import { AppError } from "./errors.js";

const ISSUER = "sri-sai-balaji-api";
const AUDIENCE = "sri-sai-balaji-web";
const ROLES = ["SUPER_ADMIN", "OWNER", "ADMIN", "INSTRUCTOR", "STUDENT"] as const;

/**
 * A high-entropy opaque token (256 bits). Used for refresh tokens and one-time links. Only its SHA-256
 * hash is ever stored, so a database leak does not reveal usable tokens. (A fast hash is correct here:
 * the input is already random, so there is nothing to brute-force.)
 */
export const generateOpaqueToken = (): string => randomBytes(32).toString("base64url");

export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export const newFamilyId = (): string => randomUUID();

/** "15m" / "1h" / "7d" / "30s" → seconds. */
export function parseDurationSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error(`Invalid duration: ${value}`);
  const unit = { s: 1, m: 60, h: 3600, d: 86_400 }[match[2] as "s" | "m" | "h" | "d"];
  return Number(match[1]) * unit;
}

const claimsSchema = z.object({
  sub: z.uuid(),
  role: z.enum(ROLES),
  /** Session (refresh-token family) this access token belongs to. Lets logout revoke it immediately. */
  sid: z.uuid(),
});

export interface AccessTokenClaims {
  sub: string;
  role: Role;
  sid: string;
}

/** Sign a short-lived access JWT (HS256). Time comes from `now` so tests can control it. */
export function signAccessToken(
  env: Pick<Env, "JWT_ACCESS_SECRET" | "JWT_ACCESS_TTL">,
  claims: AccessTokenClaims,
  now: Date,
) {
  const iat = Math.floor(now.getTime() / 1000);
  const expiresInSeconds = parseDurationSeconds(env.JWT_ACCESS_TTL);
  const token = jwt.sign({ ...claims, iat, exp: iat + expiresInSeconds }, env.JWT_ACCESS_SECRET, {
    algorithm: "HS256",
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  return { token, expiresInSeconds };
}

/**
 * Verify an access JWT. Only HS256 is accepted (never `none`), and issuer, audience and expiry are
 * enforced. Throws TOKEN_EXPIRED for an expired token and UNAUTHENTICATED for anything else wrong.
 */
export function verifyAccessToken(
  env: Pick<Env, "JWT_ACCESS_SECRET">,
  token: string,
  now: Date,
): AccessTokenClaims {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
      clockTimestamp: Math.floor(now.getTime() / 1000),
    });
    const parsed = claimsSchema.safeParse(payload);
    if (!parsed.success) throw AppError.unauthenticated();
    return parsed.data;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof jwt.TokenExpiredError) throw AppError.tokenExpired();
    throw AppError.unauthenticated();
  }
}
