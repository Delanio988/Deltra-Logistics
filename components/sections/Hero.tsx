"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import SplitText from "@/components/ui/SplitText";
import MagneticButton from "@/components/ui/MagneticButton";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSeasonal } from "@/lib/seasonal-context";
import { cn } from "@/lib/utils";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { isSeasonalBannerVisible } = useSeasonal();
  // Header grows to fit the seasonal banner (see Header.tsx) — this extra
  // clearance keeps the heading from rendering underneath the taller header.
  const bannerVisible = isSeasonalBannerVisible("public");

  // Parallax: background drifts slower than scroll, content fades out faster,
  // so the hero feels like it recedes as you scroll past it.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReducedMotion ? "0%" : "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReducedMotion ? "0%" : "18%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-bg text-fg"
    >
      {/* Background layer: animated gradient + parallax drift. TODO: swap for a
          slow-panning container-ship / globe video or image plate. */}
      <motion.div
        aria-hidden
        style={{ y: bgY }}
        className="absolute inset-0 bg-navy-radial"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,46,46,0.35),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_75%,rgba(255,101,56,0.15),transparent_40%)]" />
        <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(115deg,transparent,transparent_2px,rgb(var(--color-fg)/0.02)_2px,rgb(var(--color-fg)/0.02)_3px)]" />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-container flex-1 flex-col justify-center px-6 lg:px-12",
          bannerVisible ? "pt-[calc(var(--header-height)+2.75rem)]" : "pt-[--header-height]"
        )}
      >
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="gold-label mb-8"
        >
          Global Logistics, Reimagined
        </motion.span>

        <SplitText
          as="h1"
          text="Moving the world, one shipment at a time"
          startDelay={0.25}
          className="max-w-5xl text-display-xl font-extrabold text-fg"
        />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-8 max-w-xl text-lg text-fg/70 lg:text-xl"
        >
          Shop from any US retailer and get it home fast — Deltra Logistics
          consolidates and flies your packages from our US warehouse straight to you, with delivery and pickup
          throughout Montego Bay.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="mt-12 flex flex-wrap items-center gap-5"
        >
          <MagneticButton href="/quote" cursorLabel="Quote" className="bg-accent text-navy-950 shadow-accent hover:bg-accent-dark hover:text-white">
            Get a Quote
          </MagneticButton>
          <MagneticButton
            href="#tracking"
            cursorLabel="Track"
            className="border border-fg/25 text-fg hover:border-accent hover:text-accent"
          >
            Track a Shipment
          </MagneticButton>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        className="relative z-10 flex justify-center pb-10"
      >
        <a
          href="#calculator"
          data-cursor-hover="Scroll"
          aria-label="Scroll to next section"
          className="flex flex-col items-center gap-3 text-fg/60 transition-colors hover:text-accent"
        >
          <span className="text-[11px] font-medium uppercase tracking-widest2">Scroll</span>
          <span className="relative h-12 w-[1px] overflow-hidden bg-fg/20">
            <motion.span
              className="absolute inset-x-0 top-0 h-full bg-gold"
              animate={prefersReducedMotion ? undefined : { y: ["-100%", "100%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        </a>
      </motion.div>
    </section>
  );
}
