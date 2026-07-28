"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RateCalculator from "@/components/dashboard/RateCalculator";
import StatusTimeline from "@/components/ui/StatusTimeline";
import MagneticButton from "@/components/ui/MagneticButton";
import { EXAMPLE_TRACKING_STEPS } from "@/lib/data";
import { cn } from "@/lib/utils";

type Tab = "track" | "rate";

const TABS: { id: Tab; label: string }[] = [
  { id: "track", label: "Track Shipment" },
  { id: "rate", label: "Shipping Rate" },
];

const tabButtonId = (id: Tab) => `hero-widget-tab-${id}`;
const tabPanelId = (id: Tab) => `hero-widget-panel-${id}`;

type HeroTrackRateWidgetProps = {
  className?: string;
};

/**
 * Embedded hero widget — a real two-tab interface, not a decorative one.
 * "Rate" reuses the shared RateCalculator (same math as /quote). "Track"
 * stays honest about not having a live anonymous lookup: it's a visual
 * affordance plus a direct "sign in" path, same as the site has always said.
 */
export default function HeroTrackRateWidget({ className }: HeroTrackRateWidgetProps) {
  const [activeTab, setActiveTab] = useState<Tab>("track");
  const trackingInputId = useId();
  const trackingHintId = useId();

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const currentIndex = TABS.findIndex((t) => t.id === activeTab);
    const nextIndex = e.key === "ArrowRight" ? (currentIndex + 1) % TABS.length : (currentIndex - 1 + TABS.length) % TABS.length;
    const next = TABS[nextIndex].id;
    setActiveTab(next);
    requestAnimationFrame(() => document.getElementById(tabButtonId(next))?.focus());
  };

  return (
    <div
      id="tracking"
      className={cn("overflow-hidden rounded-3xl border border-fg/10 bg-surface shadow-card", className)}
    >
      <div
        role="tablist"
        aria-label="Track a shipment or get a shipping rate"
        className="flex border-b border-fg/8"
        onKeyDown={handleKeyDown}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              id={tabButtonId(tab.id)}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={tabPanelId(tab.id)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              data-cursor-hover={tab.label}
              className={cn(
                "flex-1 px-5 py-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
                isActive ? "bg-accent/10 text-accent" : "text-fg/50 hover:text-fg/80"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {activeTab === "track" ? (
            <motion.div
              key="track"
              id={tabPanelId("track")}
              role="tabpanel"
              aria-labelledby={tabButtonId("track")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <label htmlFor={trackingInputId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
                Tracking Number
              </label>
              <input
                id={trackingInputId}
                type="text"
                placeholder="e.g. DL55201933"
                aria-describedby={trackingHintId}
                className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
              />
              <p id={trackingHintId} className="mt-2 text-xs text-fg/50">
                Real-time status lives in your dashboard — sign in to track this number.
              </p>
              <MagneticButton
                href="/login"
                cursorLabel="Sign In"
                className="mt-4 w-full justify-center bg-accent text-navy-950 shadow-accent hover:bg-accent-dark hover:text-white"
              >
                Sign In to Track
              </MagneticButton>

              <div className="mt-6 border-t border-fg/8 pt-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-fg/40">Example shipment status</p>
                <StatusTimeline
                  steps={EXAMPLE_TRACKING_STEPS.slice(0, 3)}
                  currentStepIndex={1}
                  variant="dark"
                  className="mt-4"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="rate"
              id={tabPanelId("rate")}
              role="tabpanel"
              aria-labelledby={tabButtonId("rate")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <RateCalculator title="Get a rate" className="border-0 bg-transparent p-0 shadow-none" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
