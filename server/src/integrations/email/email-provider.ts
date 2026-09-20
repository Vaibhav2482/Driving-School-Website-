import nodemailer from "nodemailer";
import type { Logger } from "pino";
import type { Env } from "../../config/env.js";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** The body contains a one-time link. Development log output hides it unless explicitly enabled. */
  sensitive?: boolean;
}

/** Business code depends on this interface only, never on a specific mail service. */
export interface EmailProvider {
  readonly name: "smtp" | "development-log";
  /** Whether this provider really delivers mail to the recipient (false for the log-only channel). */
  readonly deliversMail: boolean;
  send(message: EmailMessage): Promise<void>;
}

/** Real delivery over SMTP (any provider that offers SMTP: Gmail, Zoho, SES, Brevo…). */
export function createSmtpEmailProvider(env: Env): EmailProvider {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.smtpSecure,
    // Refuse to send credentials or content in the clear on a real network.
    requireTLS: env.isProduction && !env.smtpSecure,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return {
    name: "smtp",
    deliversMail: true,
    async send(message) {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
    },
  };
}

/**
 * DEVELOPMENT ONLY. Used when no SMTP server is configured: nothing is delivered, the message is
 * written to the log instead. One-time links are printed only when AUTH_DEV_LOG_LINKS is enabled.
 */
export function createLogEmailProvider(
  logger: Logger,
  options: { logSensitiveBodies: boolean },
): EmailProvider {
  return {
    name: "development-log",
    deliversMail: false,
    send(message) {
      const showBody = !message.sensitive || options.logSensitiveBodies;
      logger.warn(
        {
          mode: "DEVELOPMENT: email NOT sent",
          to: message.to,
          subject: message.subject,
          ...(showBody ? { body: message.text } : {}),
        },
        "Email captured by the development log channel",
      );
      return Promise.resolve();
    },
  };
}

export function createEmailProvider(env: Env, logger: Logger): EmailProvider {
  if (env.smtpConfigured) return createSmtpEmailProvider(env);
  return createLogEmailProvider(logger, {
    logSensitiveBodies: env.AUTH_DEV_LOG_LINKS && !env.isProduction,
  });
}
