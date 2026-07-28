"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Flight-path control points, in the SVG's own viewBox units (0-480) — origin
// (bottom-left) arcing up to a destination on the right. Kept as plain
// constants so the plane glyph's JS-driven position always matches the
// static <path> drawn from the same points below.
const P0 = { x: 60, y: 380 };
const P1 = { x: 240, y: 40 };
const P2 = { x: 420, y: 140 };
const LOOP_MS = 6000;

function bezierPoint(t: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * P0.x + 2 * mt * t * P1.x + t * t * P2.x,
    y: mt * mt * P0.y + 2 * mt * t * P1.y + t * t * P2.y,
  };
}

function bezierAngleDeg(t: number) {
  const mt = 1 - t;
  const dx = 2 * mt * (P1.x - P0.x) + 2 * t * (P2.x - P1.x);
  const dy = 2 * mt * (P1.y - P0.y) + 2 * t * (P2.y - P1.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

type HeroRouteVisualProps = {
  className?: string;
};

/**
 * Branded hero-side graphic: a soft accent blob backdrop with a curved
 * flight-path line (echoing Process.tsx's route-line dot-and-gradient motif)
 * and a small plane glyph looping along it. Fills the gap left by having no
 * real product photo/video plate yet.
 */
export default function HeroRouteVisual({ className }: HeroRouteVisualProps) {
  const prefersReducedMotion = useReducedMotion();
  const mid = bezierPoint(0.5);
  const x = useMotionValue(mid.x);
  const y = useMotionValue(mid.y);
  const rotate = useMotionValue(bezierAngleDeg(0.5));
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = (now - startRef.current) % LOOP_MS;
      const t = elapsed / LOOP_MS;
      const point = bezierPoint(t);
      x.set(point.x);
      y.set(point.y);
      rotate.set(bezierAngleDeg(t));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [prefersReducedMotion, x, y, rotate]);

  return (
    <div aria-hidden className={className}>
      <div className="relative mx-auto aspect-square w-full max-w-[480px]">
        {/* Ambient backdrop — same rgba(255,46,46,...) vocabulary as Hero's own background blobs. */}
        <div className="absolute inset-0 rounded-full bg-accent/15 blur-[100px]" />
        <div className="absolute inset-10 rounded-full bg-gold/10 blur-[80px]" />

        <svg viewBox="0 0 480 480" className="relative h-full w-full">
          <defs>
            <linearGradient id="hero-route-line" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF2E2E" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FF6538" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          <path
            d={`M${P0.x},${P0.y} Q${P1.x},${P1.y} ${P2.x},${P2.y}`}
            fill="none"
            stroke="url(#hero-route-line)"
            strokeWidth={2}
            strokeDasharray="2 10"
            strokeLinecap="round"
          />

          <circle cx={P0.x} cy={P0.y} r={8} fill="#FF2E2E" opacity={0.25} />
          <circle cx={P0.x} cy={P0.y} r={4} fill="#FF2E2E" />

          <circle cx={P2.x} cy={P2.y} r={10} fill="#FF6538" opacity={0.25} />
          <circle cx={P2.x} cy={P2.y} r={5} fill="#FF6538" />

          {/* Plane glyph — a simple dart shape centered on its own origin so
              rotate pivots in place before the x/y translate positions it
              along the path above. Accent-filled so it stays visible in both
              light and dark theme (accent is a fixed, non-theme-aware color). */}
          <motion.g style={{ x, y, rotate }} className="drop-shadow-[0_0_8px_rgba(255,46,46,0.55)]">
            <path d="M-10 -6 L11 0 L-10 6 L-4 0 Z" fill="#FF2E2E" />
          </motion.g>
        </svg>
      </div>
    </div>
  );
}
