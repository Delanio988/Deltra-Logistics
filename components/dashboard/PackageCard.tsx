"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Package } from "@/lib/dashboard-data";
import { STATUS_STEP_INDEX } from "@/lib/dashboard-data";
import StatusTimeline from "@/components/ui/StatusTimeline";
import { cn } from "@/lib/utils";

// Active/in-progress statuses use red/red-orange per the brand system;
// Delivered is the one deliberate exception (a clear, accessible green for
// terminal/success state, distinct from the decorative red-black palette).
const STATUS_BADGE_STYLES: Record<Package["status"], string> = {
  Processing: "border border-white/15 bg-white/5 text-white/60",
  "In Transit": "border border-accent/30 bg-accent/10 text-accent",
  "At Customs": "border border-gold/40 bg-gold/10 text-gold",
  "Out for Delivery": "bg-accent text-navy-950",
  Delivered: "border border-green-500/40 bg-green-500/10 text-green-400",
};

type PackageCardProps = {
  pkg: Package;
  isExpanded: boolean;
  onToggle: () => void;
};

export default function PackageCard({ pkg, isExpanded, onToggle }: PackageCardProps) {
  const stepIndex = STATUS_STEP_INDEX[pkg.status];
  const progressPercent = ((stepIndex + 1) / 5) * 100;
  const panelId = `package-panel-${pkg.id}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-navy-900 shadow-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="flex w-full flex-col gap-4 p-6 text-left transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm font-semibold text-white">{pkg.trackingNumber}</span>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", STATUS_BADGE_STYLES[pkg.status])}>
              {pkg.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-white/70">{pkg.description}</p>
          <p className="mt-1 text-sm text-white/50">
            {pkg.origin} <span aria-hidden>→</span> {pkg.destination}
          </p>

          <div className="mt-4 max-w-xs">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Est. delivery</p>
            <p className="text-sm font-medium text-white">{pkg.estimatedDelivery}</p>
          </div>
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className={cn("h-5 w-5 shrink-0 text-white/40 transition-transform duration-300", isExpanded && "rotate-180")}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/8"
          >
            <div className="p-6">
              <StatusTimeline steps={pkg.timeline} currentStepIndex={stepIndex} variant="dark" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
