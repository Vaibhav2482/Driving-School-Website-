import type { RequestHandler } from "express";
import { hasAnyPermission, type Permission } from "../config/permissions.js";
import { AppError } from "../lib/errors.js";
import { getAuth } from "./authenticate.js";

/**
 * Authorisation gate. Every protected route must declare the permission(s) it needs, and the caller
 * needs ANY ONE of them. Access is denied by default: protected routers also run `authenticate` first
 * (see modules/index.ts), so a route without this middleware is still not open to the public.
 *
 * Also enforces the forced password change: while `mustChangePassword` is set, everything guarded by
 * this middleware answers 403 PASSWORD_CHANGE_REQUIRED (only /auth/me, /auth/change-password and
 * /auth/logout, which do not use it, keep working).
 *
 * Holding a `:self` / `:assigned` permission is necessary but NOT sufficient: the service must also
 * scope its query to the authenticated identity (see modules/access.ts).
 */
export function requirePermission(...permissions: [Permission, ...Permission[]]): RequestHandler {
  return (req, _res, next) => {
    const auth = getAuth(req);
    if (auth.mustChangePassword) throw AppError.passwordChangeRequired();
    if (!hasAnyPermission(auth.role, permissions)) throw AppError.forbidden();
    next();
  };
}
