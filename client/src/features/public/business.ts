import { z } from "zod";
import {
  BUSINESS_DEFAULTS,
  type BusinessInfo,
  type BusinessPhone,
} from "@/config/business-defaults";
import type { PublicSettings } from "./types";

const nullableText = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => value || null)
  .nullable();

const phonesSchema = z
  .array(
    z.object({ number: z.string().regex(/^\+?\d{10,15}$/), whatsapp: z.boolean().default(false) }),
  )
  .min(1);

const addressSchema = z.object({ lines: z.array(z.string().trim().min(1)).min(1) });

const stringList = z.array(z.string().trim().min(1));

/**
 * Turn the raw `{ key: value }` settings into typed business info.
 *
 * Rules: a key that is absent or malformed falls back to the card-printed default; a key that is
 * present but `null` means "the owner has not provided/has removed this" and is respected (for example
 * a removed recognition line is hidden, not silently restored).
 */
export function parseBusinessInfo(settings: PublicSettings | undefined): BusinessInfo {
  const raw = settings ?? {};
  const has = (key: string) => Object.prototype.hasOwnProperty.call(raw, key);

  const text = (key: string, fallback: string | null): string | null => {
    if (!has(key)) return fallback;
    const parsed = nullableText.safeParse(raw[key]);
    return parsed.success ? parsed.data : fallback;
  };

  const phones = phonesSchema.safeParse(raw["business.phones"]);
  const address = addressSchema.safeParse(raw["business.address"]);
  const services = stringList.safeParse(raw["business.confirmedServices"]);

  return {
    name: text("business.name", BUSINESS_DEFAULTS.name) ?? BUSINESS_DEFAULTS.name,
    proprietor: text("business.proprietor", BUSINESS_DEFAULTS.proprietor),
    recognition: text("business.recognition", BUSINESS_DEFAULTS.recognition),
    email: text("business.email", BUSINESS_DEFAULTS.email),
    workingHours: text("business.workingHours", BUSINESS_DEFAULTS.workingHours),
    confirmedServices: services.success ? services.data : BUSINESS_DEFAULTS.confirmedServices,
    phones: phones.success ? (phones.data as BusinessPhone[]) : BUSINESS_DEFAULTS.phones,
    addressLines: address.success ? address.data.lines : BUSINESS_DEFAULTS.addressLines,
  };
}

/** The number used for WhatsApp click-to-chat: the one flagged `whatsapp`, else the first number. */
export function getWhatsappNumber(info: BusinessInfo): string | null {
  return (info.phones.find((phone) => phone.whatsapp) ?? info.phones[0])?.number ?? null;
}

/** The main number for the "Call" action. */
export function getPrimaryPhone(info: BusinessInfo): string | null {
  return info.phones[0]?.number ?? null;
}
