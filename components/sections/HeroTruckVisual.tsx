"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

type HeroTruckVisualProps = {
  className?: string;
};

const DRIVE_DURATION = 1.15;
const DRIVE_DELAY = 0.5;

function Wheel({ cx, cy, spin }: { cx: number; cy: number; spin: boolean }) {
  return (
    <g transform={`translate(${cx},${cy})`}>
      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        initial={{ rotate: 0 }}
        animate={{ rotate: spin ? 900 : 0 }}
        transition={{ duration: DRIVE_DURATION, delay: DRIVE_DELAY, ease: "linear" }}
      >
        <circle r={30} fill="#111111" stroke="#000000" strokeWidth={3} />
        <circle r={10} fill="#3A3A3A" />
        <line x1={-23} y1={0} x2={23} y2={0} stroke="#5C5C5C" strokeWidth={5} strokeLinecap="round" />
        <line x1={0} y1={-23} x2={0} y2={23} stroke="#5C5C5C" strokeWidth={5} strokeLinecap="round" />
      </motion.g>
    </g>
  );
}

/** Clean geometric side-profile box truck, facing left (cab left, cargo box
 *  right) so it reads correctly driving in from the right edge of the hero.
 *  Placeholder until a real photo is dropped at /public/deltra-truck.png. */
function TruckSvg({ spin }: { spin: boolean }) {
  return (
    <svg viewBox="0 0 520 300" className="h-full w-full" role="img" aria-label="Deltra Logistics delivery truck">
      {/* Cargo box */}
      <rect x={150} y={68} width={300} height={155} rx={12} fill="#0A0A0A" />
      <rect x={150} y={196} width={300} height={24} fill="#FF2E2E" />
      <rect x={150} y={68} width={300} height={10} rx={5} fill="#FF6538" />

      {/* Logo badge on the side panel */}
      <rect x={255} y={106} width={150} height={66} rx={10} fill="#1A1A1A" stroke="#FF2E2E" strokeWidth={2} />
      <image href="/deltra-mark-ondark.png" x={273} y={118} width={114} height={42} preserveAspectRatio="xMidYMid meet" />

      {/* Cab: low front hood, sloped windshield, flat roof running back to the box */}
      <path d="M40,223 L40,150 L64,150 L92,102 L150,102 L150,223 Z" fill="#FF2E2E" />
      <path d="M70,145 L94,108 L150,108 L150,145 Z" fill="#BFD9E3" opacity={0.85} />
      <rect x={26} y={204} width={18} height={19} rx={3} fill="#1A1A1A" />

      {/* Wheels */}
      <Wheel cx={108} cy={242} spin={spin} />
      <Wheel cx={372} cy={242} spin={spin} />
    </svg>
  );
}

/**
 * Hero-side visual: a delivery truck carrying the Deltra logo that drives in
 * from the right on load and settles into a parked position, with a red
 * accent shape behind it. Tries a real photo at /public/deltra-truck.png
 * first (falls back to the built-in SVG truck on load error), so dropping a
 * real image in later needs no code change — just re-check the logo badge's
 * overlay position/size below once a real photo is supplied, since its
 * placement is tuned as a reasonable default, not to a specific photo.
 */
export default function HeroTruckVisual({ className }: HeroTruckVisualProps) {
  const prefersReducedMotion = useReducedMotion();
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div aria-hidden className={cn("relative", className)}>
      <div className="relative mx-auto aspect-[16/10] w-full max-w-[520px]">
        {/* Ambient backdrop — same vocabulary as the rest of the hero's visuals */}
        <div className="absolute inset-0 rounded-full bg-accent/15 blur-[100px]" />
        <div className="absolute inset-10 rounded-full bg-gold/10 blur-[80px]" />

        {/* Bolder accent shape behind the truck */}
        <motion.div
          aria-hidden
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: prefersReducedMotion ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-8 rounded-[3rem] bg-gradient-to-br from-accent/30 to-gold/15"
          style={{ transform: "rotate(-6deg)" }}
        />

        <motion.div
          className="absolute inset-0"
          initial={prefersReducedMotion ? false : { x: "45%", opacity: 0 }}
          animate={{ x: prefersReducedMotion ? "0%" : ["45%", "-1.5%", "0%"], opacity: 1 }}
          transition={{
            x: prefersReducedMotion
              ? { duration: 0 }
              : { duration: DRIVE_DURATION, times: [0, 0.82, 1], delay: DRIVE_DELAY, ease: ["easeOut", "easeOut"] },
            opacity: { duration: 0.35, delay: DRIVE_DELAY },
          }}
        >
          {/* Ground shadow, moves with the truck */}
          <motion.div
            aria-hidden
            className="absolute bottom-3 left-1/2 h-5 w-3/5 -translate-x-1/2 rounded-full bg-black/35 blur-md dark:bg-black/60"
            initial={prefersReducedMotion ? false : { opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: DRIVE_DURATION, delay: DRIVE_DELAY, ease: "easeOut" }}
          />

          {imageFailed ? (
            <TruckSvg spin={!prefersReducedMotion} />
          ) : (
            <>
              <Image
                src="/deltra-truck.png"
                alt="Deltra Logistics delivery truck"
                fill
                sizes="(max-width: 1024px) 280px, 520px"
                className="object-contain"
                onError={() => setImageFailed(true)}
              />
              {/* Default overlay position — nudge to match the real photo's side panel once one is supplied. */}
              <div className="absolute left-[52%] top-[36%] h-[16%] w-[22%]">
                <Image src="/deltra-mark-ondark.png" alt="" fill className="object-contain" />
              </div>
            </>
          )}

          {/* Speed lines during transit only */}
          {!prefersReducedMotion && (
            <svg viewBox="0 0 520 300" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
              {[0, 1, 2].map((i) => (
                <motion.rect
                  key={i}
                  x={430 + i * 16}
                  y={95 + i * 30}
                  width={64 - i * 10}
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
