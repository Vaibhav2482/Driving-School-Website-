import type { Logger } from "pino";
import type { Prisma } from "../generated/prisma/client.js";
import type { PrismaClient } from "./prisma.js";

export interface AuditEvent {
  actorId?: string | null;
  /** e.g. "auth.login", "auth.refresh_reuse_detected", "user.created" */
  action: string;
  entity: string;
  entityId?: string | null;
  /** Non-sensitive context. Keys that look secret are removed before storing. */
  after?: Record<string, unknown>;
  ipAddress?: string | null;
}

const SECRET_KEY = /pass(word)?|token|secret|authorization|cookie|hash/i;

/** Remove anything that could be a credential, however it got into the event. */
export function sanitizeAuditData(
  data: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  if (!data) return undefined;
  const clean = Object.fromEntries(Object.entries(data).filter(([key]) => !SECRET_KEY.test(key)));
  return clean as Prisma.InputJsonValue;
}

export type AuditLogger = ReturnType<typeof createAuditLogger>;

/**
 * Append-only security/audit trail. Recording is best-effort: a failure to write an audit row is logged
 * but never breaks the request that triggered it. Never pass passwords or tokens here.
 */
export function createAuditLogger(prisma: Pick<PrismaClient, "auditLog">, logger: Logger) {
  return {
    async record(event: AuditEvent): Promise<void> {
      try {
        await prisma.auditLog.create({
          data: {
            actorId: event.actorId ?? null,
            action: event.action,
            entity: event.entity,
            entityId: event.entityId ?? null,
            after: sanitizeAuditData(event.after),
            ipAddress: event.ipAddress ?? null,
          },
        });
      } catch (err) {
        logger.error({ err, action: event.action }, "Could not write audit log entry");
      }
    },
  };
}
