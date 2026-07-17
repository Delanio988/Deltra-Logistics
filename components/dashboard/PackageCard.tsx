"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Package } from "@/lib/dashboard-data";
import { STATUS_STEP_INDEX, PACKAGE_STATUSES, buildPackageTimeline } from "@/lib/dashboard-data";
import { calculateShippingCost, formatCurrency } from "@/lib/quote-config";
import StatusTimeline from "@/components/ui/StatusTimeline";
import { cn } from "@/lib/utils";

// Escalating urgency toward "Ready for Pickup" (solid, most actionable),
// then Delivered breaks out to green — the one deliberate exception to the
// red/red-orange active-state system, for a clear, accessible terminal state.
const STATUS_BADGE_STYLES: Record<Package["status"], string> = {
  "Pre-Alerted": "border border-fg/15 bg-fg/5 text-fg/60",
  "Received at Warehouse": "border border-gold/40 bg-gold/10 text-gold",
  "In Transit": "border border-accent/30 bg-accent/10 text-accent",
  "Arrived at Local Branch": "border border-accent/40 bg-accent/20 text-accent",
  "Ready for Pickup": "bg-accent text-navy-950",
  Delivered: "border border-green-500/40 bg-green-500/10 text-green-400",
};

type PackageCardProps = {
  pkg: Package;
  isExpanded: boolean;
  onToggle: () => void;
};

export default function PackageCard({ pkg, isExpanded, onToggle }: PackageCardProps) {
  const stepIndex = STATUS_STEP_INDEX[pkg.status];
  const progressPercent = ((stepIndex + 1) / PACKAGE_STATUSES.length) * 100;
  const shippingCost = calculateShippingCost(pkg.weightLb);
  const panelId = `package-panel-${pkg.id}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-fg/8 bg-surface shadow-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="flex w-full flex-col gap-4 p-6 text-left transition-colors hover:bg-fg/[0.03] sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm font-semibold text-fg">{pkg.trackingNumber}</span>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", STATUS_BADGE_STYLES[pkg.status])}>
              {pkg.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-fg/70">
            {pkg.merchant} — {pkg.description}
          </p>
          <p className="mt-1 text-sm text-fg/50">
            {pkg.weightLb} lb · {formatCurrency(shippingCost)} · Received {pkg.dateReceived}
          </p>

          <div className="mt-4 max-w-xs">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-fg/10">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </div>

        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={cn("h-5 w-5 shrink-0 text-fg/40 transition-transform duration-300", isExpanded && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-fg/8"
          >
            <div className="p-6">
              <StatusTimeline steps={buildPackageTimeline(pkg.status)} currentStepIndex={stepIndex} variant="dark" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
