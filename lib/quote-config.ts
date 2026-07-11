// Single-source shipping-rate config. Change the rate, currency, rounding
// rule, or method multipliers here and every consumer (the public quote
// page, the dashboard calculator, the admin add-package form, and every
// package's displayed cost) stays in sync automatically.

export const CURRENCY = "J$"; // Jamaican dollars — swap for your real currency symbol/code.
export const RATE_PER_LB = 600; // J$ per pound.

// Standard courier behavior: round weight up to the next whole pound before
// charging. Toggle off to charge the exact decimal weight instead.
export const ROUND_UP_WEIGHT = true;

export type ShippingMethod = "Standard Air" | "Express" | "Sea";

export const SHIPPING_METHODS: ShippingMethod[] = ["Standard Air", "Express", "Sea"];

export const SHIPPING_METHOD_MULTIPLIERS: Record<ShippingMethod, number> = {
  "Standard Air": 1,
  Express: 1.5,
  Sea: 0.6,
};

export function chargeableWeight(weightLb: number): number {
  return ROUND_UP_WEIGHT ? Math.ceil(weightLb) : weightLb;
}

export function calculateShippingCost(weightLb: number, method: ShippingMethod = "Standard Air"): number {
  if (!Number.isFinite(weightLb) || weightLb <= 0) return 0;
  return chargeableWeight(weightLb) * RATE_PER_LB * SHIPPING_METHOD_MULTIPLIERS[method];
}

export function formatCurrency(amount: number): string {
  return `${CURRENCY}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
