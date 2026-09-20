export type ClassValue = string | number | false | null | undefined | ClassValue[];

/** Join class names, skipping falsy values. Small on purpose: variants are written to avoid conflicts. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else if (value !== false && value !== null && value !== undefined && value !== "") {
      out.push(String(value));
    }
  }
  return out.join(" ");
}
