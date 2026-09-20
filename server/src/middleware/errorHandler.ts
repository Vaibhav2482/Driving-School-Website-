import type { ErrorRequestHandler } from "express";
import type { Logger } from "pino";
import { ZodError } from "zod";
import { AppError, ErrorCode, type ValidationIssue } from "../lib/errors.js";
import type { ErrorBody } from "../lib/response.js";

interface HttpLikeError {
  status?: number;
  statusCode?: number;
  type?: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Errors raised by body-parser and friends (http-errors): they carry a 4xx status and a `type`. */
function fromHttpError(err: HttpLikeError): AppError | undefined {
  const status = err.status ?? err.statusCode;
  if (status === undefined || status < 400 || status >= 500) return undefined;
  if (err.type === "entity.parse.failed")
    return AppError.badRequest("Request body is not valid JSON.");
  if (err.type === "entity.too.large") {
    return new AppError(413, ErrorCode.PAYLOAD_TOO_LARGE, "Request body is too large.");
  }
  return new AppError(status, ErrorCode.BAD_REQUEST, "The request could not be processed.");
}

/** Prisma "known request" errors, recognised structurally so this file need not import the client. */
function fromPrismaError(err: Record<string, unknown>): AppError | undefined {
  if (err.name !== "PrismaClientKnownRequestError" || typeof err.code !== "string")
    return undefined;
  switch (err.code) {
    case "P2002": // unique constraint
      return AppError.conflict("A record with these details already exists.");
    case "P2003": // foreign key constraint
      return AppError.conflict(
        "This record is linked to other data and cannot be changed this way.",
      );
    case "P2025": // record required but not found
      return AppError.notFound();
    default:
      return undefined;
  }
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    const details: ValidationIssue[] = err.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    }));
    return AppError.validation(details);
  }

  if (isObject(err)) {
    const mapped = fromPrismaError(err) ?? fromHttpError(err);
    if (mapped) return mapped;
  }

  // Unknown failure: never leak the message, stack or internals to the client.
  return new AppError(
    500,
    ErrorCode.INTERNAL_ERROR,
    "Something went wrong. Please try again later.",
  );
}

/**
 * The single place where errors become HTTP responses.
 * Stack traces and internal messages are only ever written to the server log, never to the response.
 */
export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (err, req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    const appError = toAppError(err);

    if (appError.status >= 500) {
      // `req.log` is set by pino-http; fall back to the root logger if the request never reached it.
      (req.log ?? logger).error(
        { err, requestId: req.id },
        "Unhandled error while handling request",
      );
    }

    const body: ErrorBody = {
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details === undefined ? {} : { details: appError.details }),
      },
    };
    res.status(appError.status).json(body);
  };
}
