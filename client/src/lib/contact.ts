import { SITE_NAME } from "@/config/site";

/** Digits only, e.g. "+91 96661 46913" → "919666146913". */
const digitsOnly = (value: string) => value.replace(/\D/g, "");

/** `tel:` link for click-to-call. */
export function telHref(number: string): string {
  return `tel:+${digitsOnly(number)}`;
}

/** WhatsApp click-to-chat (wa.me). No WhatsApp Business API is involved. */
export function whatsappHref(number: string, message?: string): string {
  const base = `https://wa.me/${digitsOnly(number)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Show an Indian mobile the way people write it: "+919666146913" → "9666 146 913". */
export function formatPhone(number: string): string {
  const digits = digitsOnly(number);
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  if (local.length !== 10) return number;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

export const WHATSAPP_MESSAGES = {
  general: `Hi, I would like to enquire about driving lessons at ${SITE_NAME}.`,
  rta: `Hi, I would like guidance on an RTA-related process from ${SITE_NAME}.`,
  package: (packageName: string) =>
    `Hi, I would like to enquire about the "${packageName}" plan at ${SITE_NAME}.`,
} as const;

/** A link that opens directions: the owner's map link when set, otherwise a search for the address. */
export function directionsHref(options: {
  mapUrl?: string | null;
  address?: string | null;
}): string | null {
  if (options.mapUrl) return options.mapUrl;
  if (!options.address) return null;
  const query = options.address.replace(/\s*\n\s*/g, ", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
