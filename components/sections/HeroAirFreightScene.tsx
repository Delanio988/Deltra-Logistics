"use client";

import { useRef, type MouseEvent } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * Air-freight scene above the hero van (/public/deltra-air-scene.png) — a
 * single combined image (plane, parachute box, winged box, stacked boxes,
 * hand-truck), verified transparent via its alpha channel like the van
 * photo. Only the combined mockup was supplied, no separate per-element
 * cutouts, so this animates as ONE group rather than five independently-
 * choreographed elements — a flattened raster has no internal layers to
 * move independently. Everything in this file besides the image itself
 * (background atmosphere, glow, flight-path arcs, particles, parallax) is
 * a layer *around* that single image, not a manipulation of its content.
 *
 * TODO once the five separate assets exist (deltra-plane.png,
 * deltra-parachute-box.png, deltra-winged-box.png, deltra-stacked-boxes.png,
 * deltra-handtruck.png): split the single <Image> below into five
 * absolutely-positioned layers, each restoring its own choreography —
 *   - plane: flies in from one side, settles, continuous float + faint trail
 *   - parachute box: drops from the top with a side-to-side pendulum sway
 *   - winged box: flies in from the opposite side to the plane, gentle bank
 *   - stacked boxes: rise/fade in from below, staggered per-box settle
 *   - hand-truck: slides in to one side, subtle idle sway
 * — the flight-path anchor points below already mark roughly where each
 * one sits, so the arcs/badge don't need to move when that split happens.
 */

const ENTRANCE_DELAY = 1.5; // lands just as the van's own drive-in settles (0.5s delay + 1.15s duration)
const ENTRANCE_DURATION = 0.9;
const IDLE_DELAY = ENTRANCE_DELAY + ENTRANCE_DURATION;

// Eyeballed anchor points (in a 300x200 viewBox matching the container's
// 3:2 aspect) for where each object sits inside the flattened image —
// approximate, not measured; nudge freely once seen rendered or once the
// five separate assets replace this.
const PLANE = { x: 173, y: 45 };
const WINGED_BOX = { x: 243, y: 34 };
const PARACHUTE_CANOPY = { x: 56, y: 45 };
const PARACHUTE_BOX = { x: 50, y: 67 };
const STACK_TOP = { x: 159, y: 90 };

type Point = { x: number; y: number };

function quadPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function sampleQuad(p0: Point, p1: Point, p2: Point, steps = 6) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const pt = quadPoint(p0, p1, p2, i / steps);
    xs.push(pt.x);
    ys.push(pt.y);
  }
  return { xs, ys };
}

function pathD(p0: Point, p1: Point, p2: Point) {
  return `M${p0.x},${p0.y} Q${p1.x},${p1.y} ${p2.x},${p2.y}`;
}

// Main route the plane travels along — a wide arc sweeping past it.
const MAIN_ARC = { p0: { x: 18, y: 158 }, p1: { x: PLANE.x - 23, y: PLANE.y - 39 }, p2: { x: 278, y: 62 } };
// Short "descent" line from the parachute canopy down to the box it carries.
const DESCENT_LINE = { p0: PARACHUTE_CANOPY, p1: { x: 53, y: 56 }, p2: PARACHUTE_BOX };
// Arc connecting the winged box down to the stacked boxes.
const WINGED_TO_STACK = { p0: WINGED_BOX, p1: { x: 205, y: 70 }, p2: STACK_TOP };

const mainArcSamples = sampleQuad(MAIN_ARC.p0, MAIN_ARC.p1, MAIN_ARC.p2, 8);
const descentSamples = sampleQuad(DESCENT_LINE.p0, DESCENT_LINE.p1, DESCENT_LINE.p2, 4);
const wingedStackSamples = sampleQuad(WINGED_TO_STACK.p0, WINGED_TO_STACK.p1, WINGED_TO_STACK.p2, 4);

// Badge position, as a percentage of the container (matches the 300x200 viewBox).
const BADGE_LEFT_PCT = (148 / 300) * 100;
const BADGE_TOP_PCT = (2 / 200) * 100;

// Ambient drifting specks — low density, atmosphere not confetti. Desktop only.
const PARTICLES = [
  { x: 8, y: 20, size: 3, duration: 7, delay: 0 },
  { x: 92, y: 14, size: 2, duration: 8.5, delay: 0.6 },
  { x: 20, y: 80, size: 2.5, duration: 6.5, delay: 1.1 },
  { x: 86, y: 72, size: 3, duration: 9, delay: 0.3 },
  { x: 48, y: 6, size: 2, duration: 7.5, delay: 1.4 },
  { x: 62, y: 90, size: 2.5, duration: 8, delay: 0.8 },
];

type HeroAirFreightSceneProps = {
  className?: string;
};

export default function HeroAirFreightScene({ className }: HeroAirFreightSceneProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse-move parallax, scoped to this component's own bounding box (Hero.tsx
  // stays untouched — this doesn't track the whole hero, just hovers over the
  // scene itself). Three depth tiers derived from the same raw offset.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 20, stiffness: 120 });
  const springY = useSpring(mouseY, { damping: 20, stiffness: 120 });
  const bgX = useTransform(springX, (v) => v * 5);
  const bgY = useTransform(springY, (v) => v * 3);
  const imgX = useTransform(springX, (v) => v * 9);
  const imgY = useTransform(springY, (v) => v * 6);
  const particlesX = useTransform(springX, (v) => v * 15);
  const particlesY = useTransform(springY, (v) => v * 10);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - (rect.left + rect.width / 2)) / rect.width);
    mouseY.set((e.clientY - (rect.top + rect.height / 2)) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      aria-hidden
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative mb-6", className)}
    >
      <div className="relative mx-auto aspect-[3/2] w-full max-w-[240px] overflow-hidden rounded-3xl lg:max-w-[420px]">
        {/* ---- 1. Background / lighting / glow layer ---- */}
        <motion.div aria-hidden className="absolute inset-0" style={{ x: bgX, y: bgY }}>
          {/* Faint background route texture — ambient context, not connective (see the lit flight-path arcs below for that) */}
          <svg viewBox="0 0 300 200" className="absolute inset-0 h-full w-full text-fg opacity-[0.07]">
            <path d="M-10,180 C80,140 120,40 310,15" stroke="currentColor" strokeWidth={1} fill="none" strokeDasharray="2 10" />
            <path d="M-10,15 C100,55 160,160 310,190" stroke="currentColor" strokeWidth={1} fill="none" strokeDasharray="2 10" />
          </svg>

          {/* Corner blooms bleeding accent/gold in from the edges */}
          <div className="absolute -left-8 -top-8 h-36 w-36 rounded-full bg-accent/20 blur-[70px] dark:bg-accent/25" />
          <div className="absolute -bottom-8 -right-8 h-36 w-36 rounded-full bg-gold/15 blur-[70px] dark:bg-gold/20" />

          {/* Spotlight bloom centered on the plane */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_57%_23%,rgba(255,255,255,0.18),transparent_55%)] dark:bg-[radial-gradient(circle_at_57%_23%,rgba(255,255,255,0.22),transparent_55%)]" />

          {/* Vignette to focus the center — a direct gradient (not a CSS mask,
              which rendered as a flat box) and far lighter in light mode, since
              the hero's own warm gradient already provides atmosphere there. */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.08)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.4)_100%)]" />
        </motion.div>

        {/* Contact shadow, grounding the whole composition */}
        <div
          aria-hidden
          className="absolute bottom-0 left-1/2 h-4 w-2/3 -translate-x-1/2 rounded-full bg-black/30 blur-md dark:bg-black/50"
        />

        {/* ---- Crisp image + blurred "echo": entrance, idle bob, mouse parallax ----
            Echo shares the exact same transform chain as the crisp image (rather
            than animating independently) so the two never drift apart mid-entrance. */}
        <motion.div className="absolute inset-0" style={{ x: imgX, y: imgY }}>
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
              {/* Blurred echo for a cheap glow / depth-of-field feel — desktop only, heaviest blur */}
              <div aria-hidden className="absolute inset-0 hidden scale-[1.15] opacity-30 blur-2xl lg:block">
                <Image src="/deltra-air-scene.png" alt="" fill sizes="420px" className="object-contain" />
              </div>
              <Image src="/deltra-air-scene.png" alt="" fill sizes="(max-width: 1024px) 240px, 420px" className="object-contain" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ---- 2. Flight-path & route motifs ---- */}
        <svg viewBox="0 0 300 200" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id="air-scene-route" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF2E2E" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FF6538" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          <path d={pathD(MAIN_ARC.p0, MAIN_ARC.p1, MAIN_ARC.p2)} stroke="url(#air-scene-route)" strokeWidth={1.5} strokeDasharray="2 8" strokeLinecap="round" fill="none" opacity={0.55} />
          <path d={pathD(DESCENT_LINE.p0, DESCENT_LINE.p1, DESCENT_LINE.p2)} stroke="url(#air-scene-route)" strokeWidth={1.25} strokeDasharray="1.5 6" strokeLinecap="round" fill="none" opacity={0.5} />
          <path d={pathD(WINGED_TO_STACK.p0, WINGED_TO_STACK.p1, WINGED_TO_STACK.p2)} stroke="url(#air-scene-route)" strokeWidth={1.25} strokeDasharray="1.5 6" strokeLinecap="round" fill="none" opacity={0.5} />

          {!prefersReducedMotion && (
            <>
              <motion.circle
                r={2.5}
                fill="#FF6538"
                className="drop-shadow-[0_0_4px_rgba(255,101,56,0.8)]"
                initial={{ cx: mainArcSamples.xs[0], cy: mainArcSamples.ys[0] }}
                animate={{ cx: mainArcSamples.xs, cy: mainArcSamples.ys }}
                transition={{ duration: 4, delay: IDLE_DELAY, repeat: Infinity, ease: "linear" }}
              />
              <motion.circle
                r={2}
                fill="#FF6538"
                initial={{ cx: descentSamples.xs[0], cy: descentSamples.ys[0] }}
                animate={{ cx: descentSamples.xs, cy: descentSamples.ys }}
                transition={{ duration: 2.2, delay: IDLE_DELAY + 0.3, repeat: Infinity, ease: "linear" }}
              />
              <motion.circle
                r={2}
                fill="#FF6538"
                initial={{ cx: wingedStackSamples.xs[0], cy: wingedStackSamples.ys[0] }}
                animate={{ cx: wingedStackSamples.xs, cy: wingedStackSamples.ys }}
                transition={{ duration: 2.8, delay: IDLE_DELAY + 0.6, repeat: Infinity, ease: "linear" }}
              />
            </>
          )}
        </svg>

        {/* Route tag — one small accent badge, factually accurate (Opa-locka/Miami warehouse to Montego Bay's real MBJ code) */}
        <div className="absolute" style={{ left: `${BADGE_LEFT_PCT}%`, top: `${BADGE_TOP_PCT}%` }}>
          <span className="inline-flex items-center rounded-full border border-accent/50 bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            MIA <span className="mx-0.5 text-accent">&rarr;</span> MBJ
          </span>
        </div>

        {/* ---- 3. Ambient particles — desktop only, motion only ---- */}
        {!prefersReducedMotion && (
          <motion.div className="pointer-events-none absolute inset-0 hidden lg:block" style={{ x: particlesX, y: particlesY }}>
            {PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-accent/60"
                style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
                animate={{ y: [0, -14, 0], opacity: [0.15, 0.6, 0.15] }}
                transition={{ duration: p.duration, delay: IDLE_DELAY + p.delay, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
