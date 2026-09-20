import type { RequestHandler } from "express";
import { AppError } from "../lib/errors.js";

/** Catch-all for unmatched routes; produces the standard error envelope. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.path}`));
};
