import type { BusinessInfo } from "@/config/business-defaults";

/** The number used for WhatsApp click-to-chat: the one flagged `whatsapp`, else the first number. */
export function getWhatsappNumber(info: BusinessInfo): string | null {
  return (info.phones.find((phone) => phone.whatsapp) ?? info.phones[0])?.number ?? null;
}

/** The main number for the "Call" action. */
export function getPrimaryPhone(info: BusinessInfo): string | null {
  return info.phones[0]?.number ?? null;
}
