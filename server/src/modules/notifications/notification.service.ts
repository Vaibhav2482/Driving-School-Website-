import type { Logger } from "pino";
import type { Env } from "../../config/env.js";
import type { EmailProvider } from "../../integrations/email/email-provider.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../lib/prisma.js";
import { renderTemplate, SENSITIVE_TEMPLATES, type EnquiryEmailPayload } from "./templates.js";

export type NotificationPrisma = Pick<PrismaClient, "notification">;

/** After this many failed attempts a notification is marked FAILED and left for a person to look at. */
export const MAX_ATTEMPTS = 5;
/** While one process is sending a row, other workers leave it alone for this long. */
const LEASE_MS = 5 * 60_000;
/** Wait before retry number N (1-based). The last value repeats. */
const BACKOFF_MINUTES = [1, 5, 15, 60];

/** A failure that retrying cannot fix (for example a blocked recipient). */
class PermanentDeliveryError extends Error {}

export interface EnqueueEmailInput {
  template: string;
  recipient: string;
  payload: Record<string, unknown>;
  userId?: string | null;
}

export interface NotificationServiceDeps {
  prisma: NotificationPrisma;
  logger: Logger;
  env: Env;
  emailProvider: EmailProvider;
  clock?: () => Date;
  /**
   * How background sending is kicked off after a row is queued. The default runs it on the next tick so
   * the HTTP response is never delayed. Tests inject a controllable scheduler.
   */
  schedule?: (job: () => Promise<unknown>) => void;
}

export type NotificationService = ReturnType<typeof createNotificationService>;

/**
 * Email through an OUTBOX: callers only insert a Notification row (fast, transactional with the rest of
 * the app's data). Sending happens afterwards, immediately in the background and again by the worker for
 * anything that failed, so a mail-server outage never loses a message and never fails a customer request.
 */
export function createNotificationService(deps: NotificationServiceDeps) {
  const { prisma, logger, env, emailProvider } = deps;
  const clock = deps.clock ?? (() => new Date());
  const schedule =
    deps.schedule ??
    ((job: () => Promise<unknown>) => {
      setImmediate(() => {
        job().catch((err: unknown) =>
          logger.error({ err }, "Background notification dispatch failed"),
        );
      });
    });

  /** Keep error text short and free of credentials before it is stored or logged. */
  function safeError(err: unknown): string {
    let message = err instanceof Error ? err.message : String(err);
    for (const secret of [env.SMTP_PASSWORD, env.SMTP_USER]) {
      if (secret) message = message.split(secret).join("[redacted]");
    }
    return message.replace(/\s+/g, " ").slice(0, 300);
  }

  async function enqueueEmail(input: EnqueueEmailInput): Promise<string> {
    const row = await prisma.notification.create({
      data: {
        userId: input.userId ?? null,
        recipient: input.recipient,
        channel: "EMAIL",
        template: input.template,
        payload: input.payload as Prisma.InputJsonValue,
        status: "PENDING",
        scheduledFor: clock(),
      },
      select: { id: true },
    });
    return row.id;
  }

  /** Send one queued email now. Returns what happened; never throws. */
  async function dispatchOne(id: string): Promise<"sent" | "retry" | "failed" | "skipped"> {
    const now = clock();

    // Claim the row (a lease): counts the attempt and hides it from other workers for a while.
    const claim = await prisma.notification.updateMany({
      where: { id, status: "PENDING", channel: "EMAIL", scheduledFor: { lte: now } },
      data: { attempts: { increment: 1 }, scheduledFor: new Date(now.getTime() + LEASE_MS) },
    });
    if (claim.count !== 1) return "skipped";

    const row = await prisma.notification.findUnique({ where: { id } });
    if (!row) return "skipped";

    try {
      if (!row.recipient) throw new PermanentDeliveryError("Notification has no recipient");
      // Safety net: outside production, real mail may only go to the owner's own address.
      if (
        emailProvider.deliversMail &&
        !env.isProduction &&
        row.recipient.toLowerCase() !== env.OWNER_NOTIFICATION_EMAIL?.toLowerCase()
      ) {
        throw new PermanentDeliveryError(
          "Blocked: outside production, real email is only sent to OWNER_NOTIFICATION_EMAIL",
        );
      }

      const rendered = renderTemplate(row.template, row.payload, {
        timeZone: env.BUSINESS_TIMEZONE,
      });
      await emailProvider.send({
        to: row.recipient,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
        sensitive: SENSITIVE_TEMPLATES.has(row.template),
      });

      await prisma.notification.update({
        where: { id },
        data: {
          status: "SENT",
          sentAt: clock(),
          lastError: null,
          // A sent invite/reset link must not linger in the database.
          ...(SENSITIVE_TEMPLATES.has(row.template) ? { payload: { scrubbed: true } } : {}),
        },
      });
      return "sent";
    } catch (err) {
      const message = safeError(err);
      const permanent = err instanceof PermanentDeliveryError || row.attempts >= MAX_ATTEMPTS;
      const wait = BACKOFF_MINUTES[Math.min(row.attempts, BACKOFF_MINUTES.length) - 1] ?? 60;

      logger.error(
        {
          notificationId: id,
          template: row.template,
          attempts: row.attempts,
          permanent,
          reason: message,
        },
        "Could not send notification email",
      );
      await prisma.notification
        .update({
          where: { id },
          data: permanent
            ? {
                status: "FAILED",
                lastError: message,
                ...(SENSITIVE_TEMPLATES.has(row.template) ? { payload: { scrubbed: true } } : {}),
              }
            : { lastError: message, scheduledFor: new Date(clock().getTime() + wait * 60_000) },
        })
        .catch((updateErr: unknown) =>
          logger.error({ err: updateErr }, "Could not record notification failure"),
        );
      return permanent ? "failed" : "retry";
    }
  }

  return {
    enqueueEmail,
    dispatchOne,

    /** Start sending a queued row in the background without delaying the caller. */
    scheduleDispatch(id: string): void {
      schedule(() => dispatchOne(id));
    },

    /** Queue and immediately start sending. Used by flows that must not block on the mail server. */
    async enqueueAndSend(input: EnqueueEmailInput): Promise<string> {
      const id = await enqueueEmail(input);
      schedule(() => dispatchOne(id));
      return id;
    },

    /** Retry everything that is due (called by the worker on a timer). Returns how many were attempted. */
    async dispatchDue(limit = 25): Promise<number> {
      const due = await prisma.notification.findMany({
        where: { channel: "EMAIL", status: "PENDING", scheduledFor: { lte: clock() } },
        orderBy: { scheduledFor: "asc" },
        take: limit,
        select: { id: true },
      });
      for (const { id } of due) await dispatchOne(id);
      return due.length;
    },

    /**
     * Tell the business owner about a new website enquiry. The enquiry is already saved when this runs,
     * so a problem here is logged and retried later; it must never fail the visitor's request.
     */
    async notifyOwnerOfEnquiry(payload: EnquiryEmailPayload): Promise<void> {
      const recipient = env.OWNER_NOTIFICATION_EMAIL;
      if (!recipient) {
        logger.warn(
          "OWNER_NOTIFICATION_EMAIL is not set: the owner was NOT emailed about a new enquiry",
        );
        return;
      }
      try {
        const id = await enqueueEmail({
          template: "enquiry.new",
          recipient,
          payload: { ...payload },
        });
        schedule(() => dispatchOne(id));
      } catch (err) {
        logger.error({ err }, "Could not queue the owner's enquiry notification");
      }
    },
  };
}
