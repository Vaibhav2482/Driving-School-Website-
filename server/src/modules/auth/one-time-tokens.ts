import type { AuthTokenType } from "../../generated/prisma/enums.js";
import type { PrismaClient } from "../../lib/prisma.js";
import { generateOpaqueToken, hashToken } from "../../lib/tokens.js";

export const RESET_TTL_MS = 60 * 60_000; // 1 hour
export const INVITE_TTL_MS = 7 * 24 * 60 * 60_000; // 7 days

export const RESET_VALID_FOR = "1 hour";
export const INVITE_VALID_FOR = "7 days";

type AuthTokenClient = Pick<PrismaClient, "authToken">;

/**
 * Create a one-time link token (password reset or invitation). Only the SHA-256 hash is stored; the
 * plaintext is returned once so it can be put in the emailed link. Any earlier unused token of the
 * same type for that user is invalidated, so only the newest link works.
 */
export async function createOneTimeToken(
  prisma: AuthTokenClient,
  userId: string,
  type: AuthTokenType,
  ttlMs: number,
  now: Date,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateOpaqueToken();
  const expiresAt = new Date(now.getTime() + ttlMs);
  await prisma.authToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: now },
  });
  await prisma.authToken.create({ data: { userId, type, tokenHash: hashToken(token), expiresAt } });
  return { token, expiresAt };
}

/** Build the link that goes in an email. The token travels in the query string, never in logs (see httpLogger). */
export function buildLink(
  clientOrigin: string,
  path: "/auth/reset-password" | "/auth/accept-invite",
  token: string,
): string {
  return `${clientOrigin}${path}?token=${encodeURIComponent(token)}`;
}
