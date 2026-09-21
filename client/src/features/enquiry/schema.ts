import { z } from "zod";
import { todayInBusinessTimezone } from "@/lib/time";
import type { TimeWindow } from "@/features/public/types";

/** Client-side mirror of the server's rule (Indian mobile, optional +91/91/0 prefix). UX only: the API re-validates. */
export function isValidIndianMobile(value: string): boolean {
  let digits = value.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits);
}

export const enquiryFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(100, "Please keep your name under 100 characters."),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your mobile number.")
    // An empty value is already reported by min(1) above; do not add a second message for it.
    .refine(
      (value) => value === "" || isValidIndianMobile(value),
      "Please enter a valid 10-digit Indian mobile number.",
    ),
  packageSlug: z.string(),
  preferredBranchSlug: z.string(),
  preferredDate: z
    .string()
    .refine(
      (value) => value === "" || value >= todayInBusinessTimezone(),
      "Please choose today or a future date.",
    ),
  preferredTimeWindow: z.enum(["", "MORNING", "AFTERNOON", "EVENING"]),
  pickupAddress: z.string().max(300, "Please keep this under 300 characters."),
  message: z.string().max(1000, "Please keep this under 1000 characters."),
});

export type EnquiryFormValues = z.infer<typeof enquiryFormSchema>;

const blankToUndefined = (value: string): string | undefined => value.trim() || undefined;

/** What the visitor filled in, tidied up and without the blanks. Used to compose the WhatsApp message. */
export interface EnquiryDetails {
  fullName: string;
  phone: string;
  packageSlug?: string;
  preferredBranchSlug?: string;
  preferredDate?: string;
  preferredTimeWindow?: TimeWindow;
  pickupAddress?: string;
  message?: string;
}

export function toEnquiryDetails(values: EnquiryFormValues): EnquiryDetails {
  return {
    fullName: values.fullName.trim(),
    phone: values.phone.trim(),
    packageSlug: blankToUndefined(values.packageSlug),
    preferredBranchSlug: blankToUndefined(values.preferredBranchSlug),
    preferredDate: blankToUndefined(values.preferredDate),
    preferredTimeWindow: (values.preferredTimeWindow || undefined) as TimeWindow | undefined,
    pickupAddress: blankToUndefined(values.pickupAddress),
    message: blankToUndefined(values.message),
  };
}

export const TIME_WINDOW_OPTIONS: { value: TimeWindow; label: string }[] = [
  { value: "MORNING", label: "Morning" },
  { value: "AFTERNOON", label: "Afternoon" },
  { value: "EVENING", label: "Evening" },
];
