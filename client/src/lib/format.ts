/**
 * Format an amount stored as INTEGER PAISE as Indian rupees, e.g. 500000 → "₹5,000",
 * 12550 → "₹125.50". The API and database never carry floating-point money.
 */
export function formatInr(paise: number): string {
  if (!Number.isInteger(paise)) {
    throw new TypeError(`formatInr expects an integer number of paise, received ${paise}`);
  }
  const hasFraction = paise % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}
