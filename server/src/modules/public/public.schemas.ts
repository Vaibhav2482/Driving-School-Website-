import { z } from "zod";
import { normalizeIndianMobile, normalizeText } from "../../lib/text.js";
import { addDaysIso, isValidIsoDate, todayInTimeZone } from "../../lib/time.js";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugParamsSchema = z.object({
  slug: z.string().max(100).regex(SLUG, "Invalid identifier."),
});

/** Text field: normalised first (tags and control characters stripped), then length-checked. */
const text = (max: number, options?: { multiline?: boolean }) =>
  z
    .string()
    .transform((value) => normalizeText(value, options))
    .pipe(z.string().max(max, `Please keep this under ${max} characters.`));

/** Optional field: an empty or whitespace-only value means "not provided". */
const optionalText = (max: number, options?: { multiline?: boolean }) =>
  z
    .string()
    .optional()
    .transform((value) => (value === undefined ? "" : normalizeText(value, options)))
    .pipe(z.string().max(max, `Please keep this under ${max} characters.`))
    .transform((value) => value || undefined);

const optionalSlug = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined)
  .pipe(z.string().max(100).regex(SLUG, "Invalid selection.").optional());

const MAX_DAYS_AHEAD = 365;

/**
 * Body of `POST /public/enquiries`. Built per app because "today" depends on the business time zone.
 * Unknown keys are stripped. Required: name, phone, consent. Everything else is optional.
 * (The honeypot field `website` is checked by middleware before this runs.)
 */
export function createEnquirySchema(timeZone: string) {
  return z.object({
    fullName: text(100)
      .pipe(z.string().min(2, "Please enter your name."))
      .refine((value) => /\p{L}/u.test(value), "Please enter your name."),

    phone: z
      .string({ error: "Please enter your mobile number." })
      .transform(normalizeIndianMobile)
      .pipe(z.string().min(1, "Please enter a valid 10-digit Indian mobile number.")),

    /** Selected by slug so internal ids are never exposed to or accepted from the public site. */
    packageSlug: optionalSlug,
    preferredBranchSlug: optionalSlug,

    preferredDate: z
      .string()
      .optional()
      .transform((value) => value?.trim() || undefined)
      .pipe(
        z
          .string()
          .refine(isValidIsoDate, "Please choose a valid date.")
          .refine(
            (value) => value >= todayInTimeZone(timeZone),
            "Please choose today or a future date.",
          )
          .refine(
            (value) => value <= addDaysIso(todayInTimeZone(timeZone), MAX_DAYS_AHEAD),
            "Please choose a date within the next year.",
          )
          .optional(),
      ),

    preferredTimeWindow: z
      .enum(["MORNING", "AFTERNOON", "EVENING"], { error: "Please choose a valid time window." })
      .optional(),

    pickupAddress: optionalText(300, { multiline: true }),
    message: optionalText(1000, { multiline: true }),

    consent: z.literal(true, { error: "Please tick the box to let us contact you." }),
  });
}

export type EnquiryInput = z.output<ReturnType<typeof createEnquirySchema>>;
