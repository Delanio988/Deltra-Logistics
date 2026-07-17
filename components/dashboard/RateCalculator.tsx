"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  SHIPPING_METHODS,
  SHIPPING_METHOD_MULTIPLIERS,
  RATE_PER_LB,
  CURRENCY,
  calculateShippingCost,
  chargeableWeight,
  formatCurrency,
  type ShippingMethod,
} from "@/lib/quote-config";
import { cn } from "@/lib/utils";

type RateCalculatorProps = {
  className?: string;
  title?: string;
};

/**
 * Shared shipping-rate calculator — rendered both inside the customer
 * dashboard and on the public /quote page, so it has no dashboard-specific
 * dependencies. All the math lives in lib/quote-config.ts.
 */
export default function RateCalculator({ className, title = "Shipping rate calculator" }: RateCalculatorProps) {
  const weightId = useId();
  const methodId = useId();
  const [weight, setWeight] = useState("");
  const [method, setMethod] = useState<ShippingMethod>("Standard Air");

  const parsedWeight = parseFloat(weight);
  const hasValidWeight = Number.isFinite(parsedWeight) && parsedWeight > 0;
  const cost = hasValidWeight ? calculateShippingCost(parsedWeight, method) : 0;

  return (
    <div className={cn("rounded-2xl border border-fg/8 bg-surface p-8 shadow-card", className)}>
      <span className="gold-label">Get a Quote</span>
      <h3 className="mt-4 text-xl font-bold text-fg">{title}</h3>
      <p className="mt-2 text-sm text-fg/60">
        {CURRENCY}
        {RATE_PER_LB} per pound, Standard Air. Enter your package weight for an instant estimate.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={weightId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
            Weight (lb)
          </label>
          <input
            id={weightId}
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 5"
            className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor={methodId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
            Shipping method
          </label>
          <select
            id={methodId}
            value={method}
            onChange={(e) => setMethod(e.target.value as ShippingMethod)}
            className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
          >
            {SHIPPING_METHODS.map((m) => (
              <option key={m} value={m} className="bg-surface text-fg">
                {m} (×{SHIPPING_METHOD_MULTIPLIERS[m]})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-fg/10 bg-fg/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-fg/50">Estimated cost</p>
        <AnimatePresence mode="wait">
          {hasValidWeight ? (
            <motion.p
              key={`${parsedWeight}-${method}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="mt-2 text-3xl font-extrabold text-accent"
            >
              {formatCurrency(cost)}
            </motion.p>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="mt-2 text-3xl font-extrabold text-accent"
            >
              —
            </motion.p>
          )}
        </AnimatePresence>
        {hasValidWeight && (
          <p className="mt-2 text-xs text-fg/40">
            {chargeableWeight(parsedWeight)} lb chargeable × {CURRENCY}
            {RATE_PER_LB} × {SHIPPING_METHOD_MULTIPLIERS[method]}
          </p>
        )}
      </div>
    </div>
  );
}
