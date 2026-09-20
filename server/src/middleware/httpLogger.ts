import type { RequestHandler } from "express";
import type { Logger } from "pino";
import { pinoHttp } from "pino-http";

/**
 * One structured log line per request. Deliberately minimal:
 *  - no headers (they carry credentials),
 *  - no query string (password-reset and invite tokens travel in URLs),
 *  - no bodies.
 */
export function httpLogger(logger: Logger): RequestHandler {
  return pinoHttp({
    logger,
    genReqId: (req) => req.id,
    autoLogging: { ignore: (req) => req.url === "/api/v1/health" },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req: (req: { id?: unknown; method?: string; url?: string }) => ({
        id: req.id,
        method: req.method,
        path: req.url?.split("?")[0],
      }),
      res: (res: { statusCode?: number }) => ({ statusCode: res.statusCode }),
    },
  });
}
