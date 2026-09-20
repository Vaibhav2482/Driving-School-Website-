import { format, isValid, parseISO } from "date-fns";
import { BUSINESS_TIMEZONE } from "@/config/site";

function toDate(value: string | Date): Date | null {
  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

/**
 * Format an INSTANT (an ISO-8601 timestamp from the API, always UTC) in the business time zone
 * (Asia/Kolkata), regardless of where the viewer's device is. Returns "" for invalid input.
 */
export function formatBusinessDateTime(value: string | Date): string {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: BUSINESS_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Format a calendar DATE with no time-of-day (DOB, insurance expiry…), given as "YYYY-MM-DD".
 * No time-zone conversion is applied, so the day never shifts.
 */
export function formatCalendarDate(value: string): string {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy") : "";
}

/** Today's calendar date in the business time zone as "YYYY-MM-DD" (used for date-picker minimums). */
export function todayInBusinessTimezone(now: Date = new Date()): string {
  // The "en-CA" locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
