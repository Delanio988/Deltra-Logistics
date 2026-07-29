"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * Air-freight scene above the hero van (/public/deltra-air-scene.png) — a
 * single combined image (plane, parachute box, winged box, stacked boxes,
 * hand-truck), verified transparent via its alpha channel like the van
 * photo. Only the combined mockup was supplied, no separate per-element
 * cutouts, so this animates as ONE group (one entrance, one idle drift, one
 * parallax value) rather than five independently-choreographed elements —
 * a flattened raster has no internal layers to move independently.
 *
 * TODO once the five separate assets exist (deltra-plane.png,
 * deltra-parachute-box.png, deltra-winged-box.png, deltra-stacked-boxes.png,
 * deltra-handtruck.png): split this single <Image> below into five
 * absolutely-positioned layers, each restoring its own choreography from
 * the original brief —
 *   - plane: flies in from one side, settles, continuous float + faint trail
 *   - parachute box: drops from the top with a side-to-side pendulum sway,
 *     settles into a slow hover
 *   - winged box: flies in from the opposite side to the plane, gentle
 *     bank/float once settled
 *   - stacked boxes: rise/fade in from below, staggered per-box settle
 *   - hand-truck: slides in to one side, subtle idle sway
 * — each on its own delay so they arrive as a sequence (plane → parachute →
 * winged box → stacked boxes → hand-truck) instead of the single fade below.
 */

const ENTRANCE_DELAY = 1.5; // lands just as the van's own drive-in settles (0.5s delay + 1.15s duration)
const ENTRANCE_DURATION = 0.9;
const IDLE_DELAY = ENTRANCE_DELAY + ENTRANCE_DURATION;

type HeroAirFreightSceneProps = {
  className?: string;
};

export default function HeroAirFreightScene({ className }: HeroAirFreightSceneProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div aria-hidden className={cn("relative mb-6 hidden lg:block", className)}>
      <div className="relative mx-auto aspect-[3/2] w-full max-w-[420px]">
        {/* Ambient backdrop — same vocabulary as HeroVanBoxesVisual below it */}
        <div className="absolute inset-0 rounded-full bg-accent/10 blur-[90px]" />

        <motion.div
          className="absolute inset-0"
          initial={prefersReducedMotion ? false : { opacity: 0, y: -24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: ENTRANCE_DURATION, delay: ENTRANCE_DELAY, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <motion.div
            className="h-full w-full"
            animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 6, delay: IDLE_DELAY, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <Image
              src="/deltra-air-scene.png"
              alt=""
              fill
              sizes="420px"
              className="object-contain"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
