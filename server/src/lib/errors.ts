/** Machine-readable error codes returned to API clients. */
export const ErrorCode = {
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  /** Login failed. Deliberately the same for unknown account, wrong password, locked or inactive. */
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  /** The short-lived access token has expired; the client should refresh once and retry. */
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  /** The refresh session is invalid, expired or has been revoked; the user must sign in again. */
  SESSION_INVALID: "SESSION_INVALID",
  /** Two refreshes raced with the same token; retrying with the newly set cookie will succeed. */
  REFRESH_RACE: "REFRESH_RACE",
  /** A one-time link (password reset or invitation) is invalid, used or expired. */
  INVALID_TOKEN: "INVALID_TOKEN",
  /** The account must change its password before doing anything else. */
  PASSWORD_CHANGE_REQUIRED: "PASSWORD_CHANGE_REQUIRED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ValidationIssue {
  /** Where the problem is, e.g. `body.email`. */
  path: string;
  message: string;
}

/**
 * An error that is safe to show to the API client. Anything that is NOT an AppError is treated as
 * an unexpected failure and reported as a generic 500 without leaking internals.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message = "The request could not be understood.", details?: unknown) {
    return new AppError(400, ErrorCode.BAD_REQUEST, message, details);
  }

  static validation(details: ValidationIssue[], message = "Some fields are invalid.") {
    return new AppError(400, ErrorCode.VALIDATION_ERROR, message, details);
  }

  static unauthenticated(message = "Please sign in to continue.") {
    return new AppError(401, ErrorCode.UNAUTHENTICATED, message);
  }

  static invalidCredentials(message = "Invalid credentials.") {
    return new AppError(401, ErrorCode.INVALID_CREDENTIALS, message);
  }

  static tokenExpired(message = "Your session has expired. Please sign in again.") {
    return new AppError(401, ErrorCode.TOKEN_EXPIRED, message);
  }

  static sessionInvalid(message = "Please sign in again.") {
    return new AppError(401, ErrorCode.SESSION_INVALID, message);
  }

  static refreshRace(message = "Please retry.") {
    return new AppError(409, ErrorCode.REFRESH_RACE, message);
  }

  static invalidToken(message = "This link is invalid or has expired.") {
    return new AppError(400, ErrorCode.INVALID_TOKEN, message);
  }

  static passwordChangeRequired(message = "You must change your password before continuing.") {
    return new AppError(403, ErrorCode.PASSWORD_CHANGE_REQUIRED, message);
  }

  static forbidden(message = "You do not have permission to do that.") {
    return new AppError(403, ErrorCode.FORBIDDEN, message);
  }

  static notFound(message = "The requested resource was not found.") {
    return new AppError(404, ErrorCode.NOT_FOUND, message);
  }

  static conflict(message = "This conflicts with existing data.", details?: unknown) {
    return new AppError(409, ErrorCode.CONFLICT, message, details);
  }

  static tooManyRequests(message = "Too many requests. Please try again shortly.") {
    return new AppError(429, ErrorCode.RATE_LIMITED, message);
  }

  static unavailable(message = "The service is temporarily unavailable.") {
    return new AppError(503, ErrorCode.SERVICE_UNAVAILABLE, message);
  }
}
