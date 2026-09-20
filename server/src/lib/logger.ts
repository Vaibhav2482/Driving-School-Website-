import type { DestinationStream, Logger } from "pino";
import { pino } from "pino";
import type { Env } from "../config/env.js";

/**
 * Anything matching these paths is replaced with "[REDACTED]" before it is written, even if a
 * developer accidentally logs a whole request/response/user object.
 */
export const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "*.password",
  "*.passwordHash",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "*.secret",
  "*.*.password",
  "*.*.token",
];

export function createLogger(env: Env, destination?: DestinationStream): Logger {
  const level = env.LOG_LEVEL ?? (env.isTest ? "silent" : env.isProduction ? "info" : "debug");

  const options = {
    level,
    base: { service: "sri-sai-balaji-api" },
    redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
  };

  if (destination) return pino(options, destination);

  // Pretty output for local development only; structured JSON everywhere else.
  if (env.NODE_ENV === "development") {
    return pino({
      ...options,
      transport: {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
      },
    });
  }
  return pino(options);
}
