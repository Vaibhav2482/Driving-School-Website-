import { SITE_NAME } from "@/config/site";
import type { PublicBranch, PublicPackage } from "@/features/public/types";
import { whatsappHref } from "@/lib/contact";
import { TIME_WINDOW_OPTIONS, type EnquiryDetails } from "./schema";

/** "2026-10-05" → "05 Oct 2026". Falls back to the raw text if it is not a date. */
function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, y, m, d] = match;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d} ${months[Number(m) - 1] ?? m} ${y}`;
}

interface Lookups {
  packages: PublicPackage[];
  branches: PublicBranch[];
}

/**
 * The text of the WhatsApp message a visitor sends to the school. Only what they filled in is included.
 * There is no server: the enquiry is delivered when the visitor taps "Send" in WhatsApp.
 */
export function buildEnquiryMessage(
  details: EnquiryDetails,
  { packages, branches }: Lookups,
): string {
  const plan = packages.find((p) => p.slug === details.packageSlug)?.name;
  const branch = branches.find((b) => b.slug === details.preferredBranchSlug)?.name;
  const time = TIME_WINDOW_OPTIONS.find((o) => o.value === details.preferredTimeWindow)?.label;

  const optional = (label: string, value: string | undefined) =>
    value ? [`${label}: ${value}`] : [];

  return [
    `Hello ${SITE_NAME}, I'd like to enquire about driving lessons.`,
    "",
    `Name: ${details.fullName}`,
    `Mobile: ${details.phone}`,
    ...optional("Preferred plan", plan),
    ...optional("Preferred branch", branch),
    ...optional(
      "Preferred start date",
      details.preferredDate ? formatDate(details.preferredDate) : undefined,
    ),
    ...optional("Preferred time", time),
    ...optional("Pickup address", details.pickupAddress),
    ...optional("Message", details.message),
  ].join("\n");
}

/** A WhatsApp click-to-chat link that opens the school's chat with the message ready to send. */
export function enquiryWhatsappHref(
  whatsappNumber: string,
  details: EnquiryDetails,
  lookups: Lookups,
): string {
  return whatsappHref(whatsappNumber, buildEnquiryMessage(details, lookups));
}
