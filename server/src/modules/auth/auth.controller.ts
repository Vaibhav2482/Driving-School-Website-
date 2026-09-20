import type { Request, RequestHandler } from "express";
import type { Logger } from "pino";
import type { Env } from "../../config/env.js";
import { AppError, ErrorCode } from "../../lib/errors.js";
import { sendData } from "../../lib/response.js";
import { getAuth } from "../../middleware/authenticate.js";
import { getValidated } from "../../middleware/validate.js";
import {
  acceptInviteBodySchema,
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  resetPasswordBodySchema,
} from "./auth.schemas.js";
import type { AuthService } from "./auth.service.js";
import type { AuthenticatedUser } from "./auth.types.js";
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from "./cookies.js";
import type { IssuedSession, RequestMeta } from "./session.service.js";

/** The same answer whether or not the account exists. */
export const FORGOT_PASSWORD_MESSAGE =
  "If the account exists, password reset instructions have been sent.";

const requestMeta = (req: Request): RequestMeta => ({
  ip: req.ip ?? null,
  userAgent: req.get("user-agent") ?? null,
});

/** Thin HTTP layer: validated input in, envelope out. All security decisions live in the services. */
export function createAuthController(service: AuthService, env: Env, logger: Logger) {
  /** Set the refresh cookie and answer with the access token. The refresh token is never in the body. */
  const respondWithSession: (
    res: Parameters<RequestHandler>[1],
    user: AuthenticatedUser,
    session: IssuedSession,
  ) => void = (res, user, session) => {
    setRefreshCookie(res, env, session.refreshToken);
    sendData(res, {
      user,
      accessToken: session.accessToken,
      expiresIn: session.accessTokenExpiresIn,
    });
  };

  const login: RequestHandler = async (req, res) => {
    const { body } = getValidated(req, { body: loginBodySchema });
    const { user, session } = await service.login(body, requestMeta(req));
    respondWithSession(res, user, session);
  };

  const refresh: RequestHandler = async (req, res) => {
    try {
      const { user, session } = await service.refresh(
        readRefreshCookie(req, env),
        requestMeta(req),
      );
      respondWithSession(res, user, session);
    } catch (err) {
      // A dead session: drop the useless cookie so the browser stops sending it.
      if (err instanceof AppError && err.code === ErrorCode.SESSION_INVALID)
        clearRefreshCookie(res, env);
      throw err;
    }
  };

  const logout: RequestHandler = async (req, res) => {
    await service.logout(readRefreshCookie(req, env), requestMeta(req));
    clearRefreshCookie(res, env);
    sendData(res, { loggedOut: true });
  };

  const me: RequestHandler = async (req, res) => {
    sendData(res, { user: await service.me(getAuth(req).userId) });
  };

  const changePassword: RequestHandler = async (req, res) => {
    const { body } = getValidated(req, { body: changePasswordBodySchema });
    const { user, session } = await service.changePassword(
      getAuth(req).userId,
      body,
      requestMeta(req),
    );
    respondWithSession(res, user, session);
  };

  const forgotPassword: RequestHandler = async (req, res) => {
    const { body } = getValidated(req, { body: forgotPasswordBodySchema });
    const meta = requestMeta(req);
    // Answer first, then do the work, so response time cannot reveal whether the account exists.
    sendData(res, { message: FORGOT_PASSWORD_MESSAGE });
    try {
      await service.requestPasswordReset(body.email, meta);
    } catch (err) {
      logger.error({ err }, "Password reset request failed");
    }
  };

  const resetPassword: RequestHandler = async (req, res) => {
    const { body } = getValidated(req, { body: resetPasswordBodySchema });
    await service.resetPassword(body, requestMeta(req));
    sendData(res, { message: "Your password has been changed. You can now sign in." });
  };

  const acceptInvite: RequestHandler = async (req, res) => {
    const { body } = getValidated(req, { body: acceptInviteBodySchema });
    await service.acceptInvite(body, requestMeta(req));
    sendData(res, { message: "Your password has been set. You can now sign in." });
  };

  return {
    login,
    refresh,
    logout,
    me,
    changePassword,
    forgotPassword,
    resetPassword,
    acceptInvite,
  };
}
