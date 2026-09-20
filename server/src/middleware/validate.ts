import type { Request, RequestHandler } from "express";
import type { z } from "zod";
import { AppError, type ValidationIssue } from "../lib/errors.js";

declare module "express-serve-static-core" {
  interface Request {
    /** Parsed, typed request data written by the `validate` middleware. */
    validated?: Partial<Record<RequestPart, unknown>>;
  }
}

type RequestPart = "body" | "query" | "params";

export type RequestSchemas = Partial<Record<RequestPart, z.ZodType>>;

export type Validated<S extends RequestSchemas> = {
  [K in keyof S]-?: S[K] extends z.ZodType ? z.output<S[K]> : never;
};

/**
 * Validate `body`, `query` and/or `params` against Zod schemas. The server never trusts client
 * input: unknown keys are stripped by the schemas and failures become a 400 VALIDATION_ERROR
 * listing every problem. Parsed values are read back with `getValidated`.
 *
 * (Express 5 makes `req.query` read-only, hence the separate `req.validated` object.)
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    const validated: Partial<Record<RequestPart, unknown>> = {};
    const issues: ValidationIssue[] = [];

    for (const part of ["body", "query", "params"] as const) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part]);
      if (result.success) {
        validated[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({
            path: [part, ...issue.path].map(String).join("."),
            message: issue.message,
          });
        }
      }
    }

    if (issues.length > 0) return next(AppError.validation(issues));
    req.validated = validated;
    next();
  };
}

/** Typed accessor for data parsed by `validate`. The `schemas` argument only drives type inference. */
export function getValidated<S extends RequestSchemas>(req: Request, _schemas: S): Validated<S> {
  return (req.validated ?? {}) as Validated<S>;
}
