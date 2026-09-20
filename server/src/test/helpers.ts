import type { Express } from "express";
import { Writable } from "node:stream";
import { pino } from "pino";
import { createApp } from "../app.js";
import { parseEnv, type Env } from "../config/env.js";
import { REDACT_PATHS } from "../lib/logger.js";
import type { PrismaClient } from "../lib/prisma.js";

/** A complete, valid environment for tests. These are throwaway values, not real secrets. */
export const TEST_ENV_SOURCE: Record<string, string> = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test_db",
  JWT_ACCESS_SECRET: "test-access-secret-0123456789-abcdefghijklmnop",
  JWT_REFRESH_SECRET: "test-refresh-secret-9876543210-zyxwvutsrqponm",
  CLIENT_URL: "http://localhost:5173",
};

export function testEnv(overrides: Record<string, string | undefined> = {}): Env {
  return parseEnv({ ...TEST_ENV_SOURCE, ...overrides });
}

/** A silent logger that writes to nowhere. */
export const silentLogger = pino({ level: "silent" });

/** A logger that captures each JSON log line into an array, applying the production redaction rules. */
export function capturingLogger() {
  const lines: Record<string, unknown>[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _enc, cb) {
      for (const line of chunk.toString().split("\n").filter(Boolean)) {
        lines.push(JSON.parse(line) as Record<string, unknown>);
      }
      cb();
    },
  });
  const logger = pino(
    { level: "debug", redact: { paths: REDACT_PATHS, censor: "[REDACTED]" } },
    stream,
  );
  return { logger, lines };
}

/** Database stub: the app never opens a real connection in unit tests. */
export function stubPrisma(
  queryRaw: () => Promise<unknown> = () => Promise.resolve([{ "?column?": 1 }]),
) {
  return { $queryRaw: queryRaw } as unknown as PrismaClient;
}

export function createTestApp(options: { env?: Env; prisma?: PrismaClient } = {}): Express {
  return createApp({
    env: options.env ?? testEnv(),
    logger: silentLogger,
    prisma: options.prisma ?? stubPrisma(),
  });
}
