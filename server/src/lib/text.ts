// Text normalisation for user-supplied strings. Used before validation so the stored value is
// predictable and free of markup and control characters. (React escapes on output; this is
// defence in depth for the admin panel, emails and exports built in later phases.)

// Control and invisible characters to strip, as [from, to] code-point ranges: C0/C1 controls (except tab and
// newline, handled separately), zero-width and bidirectional marks, word joiner and the byte-order mark.
// Built from numbers, so this file contains no literal control characters.
const STRIP_RANGES: [number, number][] = [
  [0x00, 0x08],
  [0x0b, 0x0c],
  [0x0e, 0x1f],
  [0x7f, 0x9f],
  [0x200b, 0x200f],
  [0x202a, 0x202e],
  [0x2060, 0x2060],
  [0xfeff, 0xfeff],
];
const CONTROL_CHARS = new RegExp(
  `[${STRIP_RANGES.map(([from, to]) => String.fromCodePoint(from) + "-" + String.fromCodePoint(to)).join("")}]`,
  "g",
);
const HTML_TAGS = /<[^>]*>/g;

/**
 * Normalise free text: Unicode NFC, strip control/invisible characters and HTML tags, trim.
 * `multiline` keeps line breaks (message, address); otherwise all whitespace collapses to one space.
 */
export function normalizeText(value: string, { multiline = false } = {}): string {
  const cleaned = value.normalize("NFC").replace(CONTROL_CHARS, "").replace(HTML_TAGS, "");
  if (!multiline) return cleaned.replace(/\s+/g, " ").trim();
  return cleaned
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Normalise an Indian mobile number to E.164 (`+91XXXXXXXXXX`). Accepts spaces, dashes, brackets,
 * and a `+91`, `91` or `0` prefix. Returns an empty string when the input is not a valid 10-digit
 * Indian mobile number (which must start with 6-9), so callers can validate with a plain check.
 */
export function normalizeIndianMobile(value: string): string {
  let digits = value.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : "";
}
