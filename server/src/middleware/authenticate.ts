import type { Request, RequestHandler } from "express";
import type { Env } from "../config/env.js";
import type { Role } from "../generated/prisma/enums.js";
import { AppError } from "../lib/errors.js";
import type { PrismaClient } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/tokens.js";

/**
 * Who is making this request, resolved on the server from the verified access token and the database.
 * Never built from anything the client sends in a body, query or path. Intentionally small: no email,
 * name or any secret.
 */
export interface AuthContext {
  userId: string;
  role: Role;
  /** The login session (refresh-token family) this request belongs to. */
  sessionId: string;
  mustChangePassword: boolean;
  /** Set when this user has a Student profile. Ownership checks use these, never client-supplied ids. */
  studentId: string | null;
  instructorId: string | null;
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

export interface AuthenticateDeps {
  env: Pick<Env, "JWT_ACCESS_SECRET">;
  prisma: Pick<PrismaClient, "refreshToken">;
  clock: () => Date;
}

/**
 * Require a valid `Authorization: Bearer <access token>`.
 *
 * Checks, in order: the JWT (signature, HS256 only, issuer, audience, expiry), then that the login
 * session it belongs to is still ACTIVE in the database, and that the user is active and not deleted.
 * Because the session is checked on every request, logging out, a password change, or refresh-token
 * reuse detection cuts off the access token immediately instead of when it expires. The role is read
 * from the database, so role changes take effect at once.
 */
export function createAuthenticate({ env, prisma, clock }: AuthenticateDeps): RequestHandler {
  return async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !/^Bearer /i.test(header)) throw AppError.unauthenticated();
    const token = header.slice(7).trim();
    if (!token) throw AppError.unauthenticated();

    const now = clock();
    const claims = verifyAccessToken(env, token, now);

    const session = await prisma.refreshToken.findFirst({
      where: { familyId: claims.sid, userId: claims.sub, revokedAt: null, expiresAt: { gt: now } },
      select: {
        user: {
          select: {
            id: true,
            role: true,
            isActive: true,
            deletedAt: true,
            mustChangePassword: true,
            student: { select: { id: true } },
            instructor: { select: { id: true } },
          },
        },
      },
    });
    const user = session?.user;
    if (!user || !user.isActive || user.deletedAt) throw AppError.unauthenticated();

    req.auth = {
      userId: user.id,
      role: user.role,
      sessionId: claims.sid,
      mustChangePassword: user.mustChangePassword,
      studentId: user.student?.id ?? null,
      instructorId: user.instructor?.id ?? null,
    };
    next();
  };
}

/** The authenticated identity. Throws 401 if a route forgot to run `authenticate` (fail closed). */
export function getAuth(req: Request): AuthContext {
  if (!req.auth) throw AppError.unauthenticated();
  return req.auth;
}
