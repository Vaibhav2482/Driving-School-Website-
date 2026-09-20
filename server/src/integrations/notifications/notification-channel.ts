import type { NotificationChannel as ChannelName } from "../../generated/prisma/enums.js";

/**
 * CONTRACT ONLY — implemented in Phase 12 (notifications).
 *
 * Domain code never talks to a channel directly. It calls a single `notify(...)` entry point that
 * writes Notification rows (the outbox); a dispatcher then delivers PENDING rows through the
 * channel registered for `row.channel`. V1 channels: IN_APP (database only) and EMAIL. WhatsApp is
 * click-to-chat links only; there is no paid WhatsApp/SMS integration.
 */
export interface NotificationChannel {
  readonly name: ChannelName;
  send(message: OutboundMessage): Promise<void>;
}

export interface OutboundMessage {
  /** Email address or phone number, depending on the channel. */
  recipient: string;
  template: string;
  payload: Record<string, unknown>;
}
