// Builds the "{Name}-{Code}" string shown as the customer's shipping-label
// name across the dashboard. The account code is what lets the warehouse
// match a package to a customer, so it is ALWAYS included verbatim,
// character-for-character — only the name portion is ever shortened, and
// only as far as actually needed to fit a given retailer's limit.

export type ShippingNameStep = "full" | "last-initial" | "first-initial" | "both-initials";

export type FormatShippingNameResult = {
  value: string;
  step: ShippingNameStep;
  wasShortened: boolean;
  /** True when even the shortest form (both initials) still exceeds
   *  maxLength. `value` is still returned (both-initials, full intact
   *  code) as a best effort, but the caller should surface a warning
   *  rather than treat this as a normal result. */
  overflows: boolean;
  charCount: number;
  maxLength: number;
};

/**
 * Tries, in order: full "First Last", last name reduced to its initial,
 * first name reduced to its initial, then both as initials — returning the
 * first one that fits within maxLength once joined to the account code.
 * If even both-initials doesn't fit, returns that form anyway (still with
 * the complete, unmodified code) and sets `overflows: true`.
 */
export function formatShippingName(
  firstName: string,
  lastName: string,
  accountCode: string,
  maxLength = 34,
  separator = "-"
): FormatShippingNameResult {
  const first = firstName.trim();
  const last = lastName.trim();
  const firstInitial = first.charAt(0);
  const lastInitial = last.charAt(0);

  const candidates: { name: string; step: ShippingNameStep }[] = [
    { name: `${first} ${last}`.trim(), step: "full" },
    { name: `${first} ${lastInitial}`.trim(), step: "last-initial" },
    { name: `${firstInitial} ${last}`.trim(), step: "first-initial" },
    { name: `${firstInitial} ${lastInitial}`.trim(), step: "both-initials" },
  ];

  for (const candidate of candidates) {
    const value = `${candidate.name}${separator}${accountCode}`;
    if (value.length <= maxLength) {
      return {
        value,
        step: candidate.step,
        wasShortened: candidate.step !== "full",
        overflows: false,
        charCount: value.length,
        maxLength,
      };
    }
  }

  const shortest = candidates[candidates.length - 1];
  const value = `${shortest.name}${separator}${accountCode}`;
  return {
    value,
    step: shortest.step,
    wasShortened: true,
    overflows: true,
    charCount: value.length,
    maxLength,
  };
}

/** Human-readable "why" note for the UI — null when the name fit as-is. */
export function describeShippingNameStep(result: FormatShippingNameResult, retailerLabel: string): string | null {
  if (!result.wasShortened) return null;
  return `Shortened to fit ${retailerLabel}'s ${result.maxLength}-character limit.`;
}
