"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

type HeroVanBoxesVisualProps = {
  className?: string;
};

const DRIVE_DURATION = 1.15;
const DRIVE_DELAY = 0.5;
const IDLE_DELAY = DRIVE_DELAY + DRIVE_DURATION;

/**
 * Hero-side visual: the composite Deltra van + boxes-on-a-hand-truck photo
 * (/public/deltra-van-boxes.png), a genuine transparent PNG (verified via its
 * alpha channel — 0 at all four corners, 255 across the van body, a soft
 * vignette falloff in between) — so it sits directly on the dark hero with
 * no card wrapper, unlike the two prior rounds' white-background photos.
 * Drives in from the right on load (translate + a slight scale-up, since a
 * pure sideways slide fights this photo's 3/4 perspective), then settles
 * into a continuous, barely-there idle bob with a shadow that breathes
 * opposite it, like a real contact shadow.
 */
export default function HeroVanBoxesVisual({ className }: HeroVanBoxesVisualProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div aria-hidden className={cn("relative", className)}>
      <div className="relative mx-auto aspect-[3/2] w-full max-w-[560px]">
        {/* Ambient backdrop — same vocabulary as the rest of the hero's visuals */}
        <div className="absolute inset-0 rounded-full bg-accent/15 blur-[100px]" />
        <div className="absolute inset-10 rounded-full bg-gold/10 blur-[80px]" />

        {/* Bolder accent shape behind the van — visible through the photo's transparent edges */}
        <motion.div
          aria-hidden
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: prefersReducedMotion ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-6 rounded-[3rem] bg-gradient-to-br from-accent/35 to-gold/15"
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
          {/* Ground shadow — fades/widens in with the drive-in (one-shot,
              outer layer), then softly "breathes" opposite the idle bob once
              parked (continuous, inner layer — kept as a separate animation
              so the infinite loop never resets the entrance fade-in). */}
          <motion.div
            aria-hidden
            className="absolute bottom-6 left-1/2 w-2/5 -translate-x-1/2"
            initial={prefersReducedMotion ? false : { opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: DRIVE_DURATION, delay: DRIVE_DELAY, ease: "easeOut" }}
          >
            <motion.div
              className="h-5 w-full rounded-full bg-black/40 blur-md dark:bg-black/60"
              animate={prefersReducedMotion ? undefined : { opacity: [1, 0.8, 1], scaleX: [1, 0.9, 1] }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : { duration: 4, delay: IDLE_DELAY, repeat: Infinity, ease: "easeInOut" }
              }
            />
          </motion.div>

          {/* Van + boxes photo */}
          <motion.div
            className="absolute inset-0"
            animate={prefersReducedMotion ? undefined : { y: [0, -6, 0] }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 4, delay: IDLE_DELAY, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <Image
              src="/deltra-van-boxes.png"
              alt="Deltra Logistics delivery van and boxes stacked on a hand truck"
              fill
              sizes="(max-width: 1024px) 300px, 560px"
              className="object-contain"
              priority
            />
          </motion.div>

          {/* Speed lines during transit only */}
          {!prefersReducedMotion && (
            <svg viewBox="0 0 560 373" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
              {[0, 1, 2].map((i) => (
                <motion.rect
                  key={i}
                  x={500 + i * 16}
                  y={110 + i * 45}
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
