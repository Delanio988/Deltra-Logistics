"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

type HeroVehicleVisualProps = {
  className?: string;
};

const DRIVE_DURATION = 1.15;
const DRIVE_DELAY = 0.5;

/**
 * Hero-side visual: the real Deltra delivery van (/public/deltra-van.jpg),
 * shot 3/4-front with a white background. Sits in a fixed off-white card
 * (not directly on the dark hero) so the white background reads as a
 * deliberate framed photo in both themes, with a livery stripe + logo badge
 * overlaid on the van's side panel (positioned by eye against the actual
 * photo, not a guess). Drives in from the right on load — translate *and*
 * a slight scale-up, since a pure sideways slide fights this photo's 3/4
 * perspective (it should read as "approaching and parking", not sliding).
 */
export default function HeroVehicleVisual({ className }: HeroVehicleVisualProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div aria-hidden className={cn("relative", className)}>
      <div className="relative mx-auto aspect-[533/374] w-full max-w-[520px]">
        {/* Ambient backdrop — same vocabulary as the rest of the hero's visuals */}
        <div className="absolute inset-0 rounded-full bg-accent/15 blur-[100px]" />
        <div className="absolute inset-10 rounded-full bg-gold/10 blur-[80px]" />

        {/* Bolder accent shape behind the van */}
        <motion.div
          aria-hidden
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: prefersReducedMotion ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-4 rounded-[3rem] bg-gradient-to-br from-accent/30 to-gold/15"
          style={{ transform: "rotate(-6deg)" }}
        />

        <motion.div
          className="absolute inset-0"
          initial={prefersReducedMotion ? false : { x: "45%", scale: 0.9, opacity: 0 }}
          animate={{
            x: prefersReducedMotion ? "0%" : ["45%", "-1.5%", "0%"],
            scale: prefersReducedMotion ? 1 : [0.9, 1.03, 1],
            opacity: 1,
          }}
          transition={{
            x: prefersReducedMotion
              ? { duration: 0 }
              : { duration: DRIVE_DURATION, times: [0, 0.82, 1], delay: DRIVE_DELAY, ease: ["easeOut", "easeOut"] },
            scale: prefersReducedMotion
              ? { duration: 0 }
              : { duration: DRIVE_DURATION, times: [0, 0.82, 1], delay: DRIVE_DELAY, ease: ["easeOut", "easeOut"] },
            opacity: { duration: 0.35, delay: DRIVE_DELAY },
          }}
        >
          {/* Ground shadow, moves with the van */}
          <motion.div
            aria-hidden
            className="absolute bottom-1 left-1/2 h-5 w-3/5 -translate-x-1/2 rounded-full bg-black/35 blur-md dark:bg-black/60"
            initial={prefersReducedMotion ? false : { opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: DRIVE_DURATION, delay: DRIVE_DELAY, ease: "easeOut" }}
          />

          {/* Photo card — fixed off-white, not theme-aware, so the photo's own
              white background blends into it in both light and dark mode */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl bg-offwhite p-4 shadow-card sm:p-5">
            <div className="relative h-full w-full">
              <Image
                src="/deltra-van.jpg"
                alt="Deltra Logistics delivery van"
                fill
                sizes="(max-width: 1024px) 280px, 520px"
                className="object-contain"
                priority
              />

              {/* Livery stripe across the lower body panel */}
              <div
                aria-hidden
                className="absolute inset-x-[4%] top-[51%] h-[8%] -rotate-2 rounded-sm bg-gradient-to-r from-navy-950 via-accent to-accent/70 opacity-90"
              />

              {/* Logo badge on the side cargo panel */}
              <div className="absolute left-[59%] top-[19%] h-[20%] w-[19%] rounded-xl border-2 border-accent bg-navy-950 p-1 shadow-md">
                <div className="relative h-full w-full">
                  <Image src="/deltra-mark-ondark.png" alt="" fill className="object-contain" />
                </div>
              </div>
            </div>
          </div>

          {/* Speed lines during transit only */}
          {!prefersReducedMotion && (
            <svg viewBox="0 0 533 374" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
              {[0, 1, 2].map((i) => (
                <motion.rect
                  key={i}
                  x={480 + i * 16}
                  y={120 + i * 40}
                  width={50 - i * 8}
                  height={5}
                  rx={2.5}
                  fill="#FF6538"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.55, 0] }}
                  transition={{ duration: DRIVE_DURATION * 0.65, delay: DRIVE_DELAY + i * 0.05, ease: "easeOut" }}
                />
              ))}
            </svg>
          )}
        </motion.div>
      </div>
    </div>
  );
}
