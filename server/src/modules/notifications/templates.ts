import type { Prisma } from "../../generated/prisma/client.js";

/** Business name used in email copy. */
const BUSINESS_NAME = "Sri Sai Balaji Driving School";

/**
 * Templates whose payload contains a one-time link. Their payload is wiped once the email is sent (or
 * has permanently failed), so a usable link never lingers in the outbox table.
 */
export const SENSITIVE_TEMPLATES: ReadonlySet<string> = new Set([
  "account.invite",
  "account.password-reset",
]);

/** Fields for the owner's new-enquiry email. Deliberately no ids, no IP address, nothing technical. */
export interface EnquiryEmailPayload {
  fullName: string;
  phone: string;
  packageName?: string | null;
  branchName?: string | null;
  /** YYYY-MM-DD */
  preferredDate?: string | null;
  preferredTimeWindow?: "MORNING" | "AFTERNOON" | "EVENING" | null;
  pickupAddress?: string | null;
  message?: string | null;
  /** ISO-8601 instant */
  receivedAt: string;
}

export interface AccountLinkPayload {
  name: string;
  link: string;
  /** Human-readable, e.g. "1 hour" */
  validFor: string;
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export interface RenderContext {
  timeZone: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const TIME_WINDOW_LABEL = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
} as const;
const NOT_SPECIFIED = "Not specified";

function formatReceivedAt(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const formatted = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
  return timeZone === "Asia/Kolkata" ? `${formatted} IST` : `${formatted} (${timeZone})`;
}

function formatPreferredDate(value: string | null | undefined): string {
  if (!value) return NOT_SPECIFIED;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", dateStyle: "medium" }).format(date);
}

/** Owner notification: "New Driving School Enquiry". */
export function renderEnquiryEmail(
  payload: EnquiryEmailPayload,
  context: RenderContext,
): RenderedEmail {
  const rows: [string, string][] = [
    ["Name", payload.fullName],
    ["Phone", payload.phone],
    ["Preferred Package", payload.packageName || NOT_SPECIFIED],
    ...(payload.branchName
      ? ([["Preferred Branch", payload.branchName]] as [string, string][])
      : []),
    ["Preferred Date", formatPreferredDate(payload.preferredDate)],
    [
      "Preferred Time",
      payload.preferredTimeWindow ? TIME_WINDOW_LABEL[payload.preferredTimeWindow] : NOT_SPECIFIED,
    ],
    ["Pickup Address", payload.pickupAddress || NOT_SPECIFIED],
    ["Message", payload.message || NOT_SPECIFIED],
    ["Received At", formatReceivedAt(payload.receivedAt, context.timeZone)],
  ];

  const intro = `New enquiry received for ${BUSINESS_NAME}.`;
  const text = [intro, "", ...rows.map(([label, value]) => `${label}: ${value}`), ""].join("\n");

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f1ec;font-family:Arial,Helvetica,sans-serif;color:#0b1230;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e9e4dc;border-radius:12px;padding:24px;">
<p style="margin:0 0 16px;font-size:16px;font-weight:bold;">${escapeHtml(intro)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="padding:8px 12px 8px 0;color:#6a6357;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:8px 0;vertical-align:top;white-space:pre-line;">${escapeHtml(value)}</td></tr>`,
  )
  .join("\n")}
</table>
</div></body></html>`;

  return { subject: "New Driving School Enquiry", text, html };
}

function renderLinkEmail(
  subject: string,
  intro: string,
  payload: AccountLinkPayload,
  action: string,
): RenderedEmail {
  const lines = [
    `Hello ${payload.name},`,
    "",
    intro,
    "",
    `${action}: ${payload.link}`,
    "",
    `This link works once and is valid for ${payload.validFor}. If you did not expect this email, you can ignore it.`,
    "",
    BUSINESS_NAME,
  ];
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f1ec;font-family:Arial,Helvetica,sans-serif;color:#0b1230;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e9e4dc;border-radius:12px;padding:24px;">
<p>Hello ${escapeHtml(payload.name)},</p>
<p>${escapeHtml(intro)}</p>
<p><a href="${escapeHtml(payload.link)}" style="display:inline-block;background:#c92a25;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px;">${escapeHtml(action)}</a></p>
<p style="font-size:13px;color:#6a6357;">This link works once and is valid for ${escapeHtml(payload.validFor)}. If you did not expect this email, you can ignore it.</p>
<p style="font-size:13px;color:#6a6357;">${escapeHtml(BUSINESS_NAME)}</p>
</div></body></html>`;
  return { subject, text: lines.join("\n"), html };
}

export const renderInviteEmail = (payload: AccountLinkPayload): RenderedEmail =>
  renderLinkEmail(
    `Your ${BUSINESS_NAME} account`,
    `An account has been created for you at ${BUSINESS_NAME}. Choose a password to get started.`,
    payload,
    "Set your password",
  );

export const renderPasswordResetEmail = (payload: AccountLinkPayload): RenderedEmail =>
  renderLinkEmail(
    `Reset your ${BUSINESS_NAME} password`,
    "We received a request to reset your password.",
    payload,
    "Reset your password",
  );

/** Render a stored outbox row into an email. Unknown templates are a programming error. */
export function renderTemplate(
  template: string,
  payload: Prisma.JsonValue,
  context: RenderContext,
): RenderedEmail {
  switch (template) {
    case "enquiry.new":
      return renderEnquiryEmail(payload as unknown as EnquiryEmailPayload, context);
    case "account.invite":
      return renderInviteEmail(payload as unknown as AccountLinkPayload);
    case "account.password-reset":
      return renderPasswordResetEmail(payload as unknown as AccountLinkPayload);
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}
