"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Package } from "@/lib/dashboard-data";
import { sumBalanceDue, type Bill } from "@/lib/billing";
import { formatCurrency } from "@/lib/quote-config";
import { useReducedMotion } from "@/lib/useReducedMotion";
import BillRow from "@/components/dashboard/BillRow";

type OutstandingBillsProps = {
  bills: Bill[];
  packages: Package[];
  selectedIds: string[];
  onToggleSelect: (billId: string) => void;
  onPayNow: (billIds: string[]) => void;
};

export default function OutstandingBills({ bills, packages, selectedIds, onToggleSelect, onPayNow }: OutstandingBillsProps) {
  const prefersReducedMotion = useReducedMotion();
  const selectedTotal = sumBalanceDue(bills.filter((b) => selectedIds.includes(b.id)));

  if (bills.length === 0) {
    return (
      <div className="rounded-2xl border border-fg/8 bg-surface p-8 text-center shadow-card">
        <p className="text-sm font-medium text-fg/70">You&rsquo;re all caught up — no bills due.</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <ul className="space-y-4">
        {bills.map((bill) => (
          <BillRow
            key={bill.id}
            bill={bill}
            pkg={packages.find((p) => p.id === bill.packageId)}
            selected={selectedIds.includes(bill.id)}
            onToggleSelect={() => onToggleSelect(bill.id)}
            onPayNow={() => onPayNow([bill.id])}
          />
        ))}
      </ul>

      <AnimatePresence>
        {selectedIds.length >= 1 && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-6"
          >
            <div className="pointer-events-auto flex flex-wrap items-center gap-4 rounded-full border border-accent/30 bg-surface px-6 py-4 shadow-card">
              <span className="text-sm font-medium text-fg/70">
                {selectedIds.length} bill{selectedIds.length === 1 ? "" : "s"} selected
              </span>
              <span className="text-lg font-extrabold text-fg">{formatCurrency(selectedTotal)}</span>
              <button
                type="button"
                onClick={() => onPayNow(selectedIds)}
                data-cursor-hover="Pay Selected"
                className="min-h-11 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-navy-950 shadow-accent transition-colors hover:bg-accent-dark hover:text-white"
              >
                Pay Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
