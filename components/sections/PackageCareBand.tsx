"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Photo-driven band between Services ("what we do") and FeatureGrid ("why
 * choose us") — a warmer, human moment about careful handling before the
 * bold numbered grid. Fixed-light section (matches Services.tsx/Process.tsx),
 * so the boxes photo's own white background sits on a near-matching
 * off-white section instead of clashing with a dark one.
 */
export default function PackageCareBand() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? ["0%", "0%"] : ["-6%", "6%"]);

  return (
    <section ref={sectionRef} className="bg-offwhite py-28 lg:py-36">
      <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:gap-12 lg:px-12">
        <motion.div style={{ y: parallaxY }} className="relative mx-auto aspect-[707/800] w-full max-w-md">
          <div aria-hidden className="absolute -inset-6 rounded-[2.5rem] bg-accent/15 blur-3xl" />
          <motion.div
            className="relative h-full w-full overflow-hidden rounded-3xl border border-navy-950/8 bg-white p-6 shadow-card"
            animate={prefersReducedMotion ? undefined : { y: [0, -10, 0] }}
            transition={prefersReducedMotion ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="relative h-full w-full">
              <Image
                src="/deltra-boxes.jpg"
                alt="Packages stacked on a hand truck, ready for delivery"
                fill
                sizes="(max-width: 1024px) 360px, 480px"
                className="object-contain"
              />
            </div>
          </motion.div>
        </motion.div>

        <ScrollReveal>
          <span className="gold-label">Careful Handling</span>
          <h2 className="mt-6 text-display-md font-extrabold text-navy-950">Every Package, Handled With Care</h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-navy-950/65">
            Every order you place gets consolidated at our US warehouse, inspected, and packed
            for the flight home — then delivered or ready for pickup throughout Montego Bay.
            One team handles it start to finish, so nothing gets lost along the way.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
