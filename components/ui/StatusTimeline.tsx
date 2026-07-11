"use client";

import { motion } from "framer-motion";
import type { TrackingStatus } from "@/lib/data";
import { cn } from "@/lib/utils";

type StatusTimelineProps = {
  steps: TrackingStatus[];
  /** Index of the last completed step; steps at or before this are marked done. */
  currentStepIndex: number;
  className?: string;
  /** "light" for a white/light card (TrackShipment); "dark" for a dark-gray card (dashboard). */
  variant?: "light" | "dark";
};

/**
 * Vertical step timeline with an animated accent-red fill connecting
 * completed steps. Shared by the public tracking widget (TrackShipment) and
 * the dashboard's package detail view, which sit on different-toned cards —
 * hence the light/dark variant rather than hardcoded text/border colors.
 */
export default function StatusTimeline({ steps, currentStepIndex, className, variant = "light" }: StatusTimelineProps) {
  const isDark = variant === "dark";

  return (
    <ol className={cn("space-y-0", className)}>
      {steps.map((step, i) => {
        const isComplete = i <= currentStepIndex;
        const isLast = i === steps.length - 1;
        return (
          <li key={step.label} className="relative flex gap-5 pb-10 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={cn("absolute left-[11px] top-6 h-full w-px", isDark ? "bg-white/10" : "bg-navy-950/10")}
              >
                <motion.span
                  className="block w-full bg-accent"
                  initial={{ height: 0 }}
                  animate={{ height: isComplete ? "100%" : "0%" }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                />
              </span>
            )}
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className={cn(
                "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                isComplete ? "border-accent bg-accent" : isDark ? "border-white/15 bg-navy-900" : "border-navy-950/15 bg-white"
              )}
            >
              {isComplete && (
                <svg viewBox="0 0 12 12" className="h-3 w-3 text-navy-950" fill="none">
                  <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </motion.span>
            <div>
              <p
                className={cn(
                  "font-semibold",
                  isComplete ? (isDark ? "text-white" : "text-navy-950") : isDark ? "text-white/40" : "text-navy-950/40"
                )}
              >
                {step.label}
              </p>
              <p className={cn("mt-1 text-sm", isDark ? "text-white/50" : "text-navy-950/50")}>{step.description}</p>
              <p className={cn("mt-1 text-xs", isDark ? "text-white/35" : "text-navy-950/35")}>{step.timestamp}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
