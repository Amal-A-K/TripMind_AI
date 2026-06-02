/**
 * Currency Utilities — Indian Rupee (INR)
 *
 * Centralises all currency formatting so every part of the UI
 * produces a consistent ₹ display without scattering Intl calls.
 */

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0, // Whole rupees only — cleaner for travel budgets
});

/**
 * Formats a numeric amount as an Indian Rupee string.
 *
 * @example
 * formatCurrency(1200)   // "₹1,200"
 * formatCurrency(35000)  // "₹35,000"
 *
 * @param amount - Numeric value to format
 * @returns Formatted INR string with ₹ prefix
 */
export function formatCurrency(amount: number): string {
  return INR_FORMATTER.format(amount);
}

/**
 * Attempts to parse a raw cost string returned by the AI (e.g. "₹500",
 * "500", "INR 1200", "1,200") and re-formats it consistently.
 * Falls back to the original string if parsing fails.
 *
 * @param raw - Raw cost string from AI or DB
 * @returns Consistently formatted INR string, or the original raw value
 */
export function formatRawCost(raw: string | undefined | null): string {
  if (!raw) return "";
  // Strip known currency prefixes and commas before parsing
  const cleaned = raw.replace(/[₹$€£¥,\s]|INR|USD|EUR/gi, "").trim();
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num > 0) return formatCurrency(num);
  return raw; // Keep AI string as-is if it's not a plain number (e.g. "₹500–₹800")
}
