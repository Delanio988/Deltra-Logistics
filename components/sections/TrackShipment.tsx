"use client";

import { useId, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TRACKING_DATA } from "@/lib/data";
import ScrollReveal from "@/components/ui/ScrollReveal";
import MagneticButton from "@/components/ui/MagneticButton";
import StatusTimeline from "@/components/ui/StatusTimeline";

export default function TrackShipment() {
  const [query, setQuery] = useState("");
  const [activeNumber, setActiveNumber] = useState<string | null>(null);
  const inputId = useId();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Client-side mock only: any tracking number resolves to the same demo
    // timeline. TODO: replace with a real tracking API call.
    setActiveNumber(query.trim().toUpperCase());
  };

  const timeline = activeNumber ? TRACKING_DATA.DEFAULT : null;
  const currentStepIndex = timeline ? timeline.length - 2 : -1; // "in progress" demo state

  return (
    <section id="tracking" className="bg-offwhite py-28 lg:py-36">
      <div className="mx-auto max-w-container px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-20">
          <ScrollReveal direction="left">
            <span className="gold-label">Track Your Shipment</span>
            <h2 className="mt-6 text-display-md font-extrabold text-navy-950">
              Know exactly where it is
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-navy-950/65">
              Enter any tracking number to see a live status timeline. TODO: wire up to the
              real tracking API — this demo uses mock data.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <label htmlFor={inputId} className="sr-only">
                Tracking number
              </label>
              <input
                id={inputId}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. DL10293847"
                className="w-full rounded-full border border-navy-950/15 bg-white px-6 py-4 text-sm text-navy-950 outline-none transition-colors focus:border-accent"
              />
              <MagneticButton
                type="submit"
                cursorLabel="Track"
                strength={0.2}
                className="shrink-0 bg-navy-950 text-white hover:bg-accent"
              >
                Track
              </MagneticButton>
            </form>
          </ScrollReveal>

          <div className="rounded-3xl border border-navy-950/8 bg-white p-8 shadow-card lg:p-12">
            <AnimatePresence mode="wait">
              {timeline ? (
                <motion.div
                  key={activeNumber}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-sm font-medium text-navy-950/50">
                    Tracking number <span className="font-semibold text-navy-950">{activeNumber}</span>
                  </p>
                  <StatusTimeline steps={timeline} currentStepIndex={currentStepIndex} className="mt-8" />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full min-h-[280px] flex-col items-center justify-center text-center text-navy-950/40"
                >
                  <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth={1.3}>
                    <rect x="6" y="16" width="24" height="16" rx="2" />
                    <path d="M30 22h8l6 6v4h-4" />
                    <circle cx="16" cy="34" r="3" />
                    <circle cx="36" cy="34" r="3" />
                  </svg>
                  <p className="mt-4 max-w-xs text-sm">
                    Enter a tracking number to see its live status timeline.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
