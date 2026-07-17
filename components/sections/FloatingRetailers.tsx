"use client";

import { useEffect, useState } from "react";
import { RETAILERS } from "@/lib/retailers";
import Marquee from "@/components/ui/Marquee";
import LogoTile from "@/components/ui/LogoTile";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useReducedMotion } from "@/lib/useReducedMotion";

const BASE_DURATION_ROW_1 = 40;
const BASE_DURATION_ROW_2 = 55;
// Slower on mobile — same brands, gentler drift rather than a lighter set,
// so the section stays just as recognizable on small screens.
const MOBILE_DURATION_MULTIPLIER = 1.5;

export default function FloatingRetailers() {
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    setIsMobile(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const multiplier = isMobile ? MOBILE_DURATION_MULTIPLIER : 1;

  return (
    <section className="bg-bg py-28 text-fg lg:py-36">
      <div className="mx-auto max-w-container px-6 lg:px-12">
        <ScrollReveal className="text-center">
          <span className="gold-label justify-center">Ship From The US</span>
          <h2 className="mt-6 text-display-md font-extrabold text-fg">Shop your favorite US stores</h2>
          <p className="mx-auto mt-4 max-w-xl text-fg/65">We&rsquo;ll ship it to Jamaica.</p>
        </ScrollReveal>
      </div>

      <div className="mt-16">
        {prefersReducedMotion ? (
          <div className="mx-auto grid max-w-container grid-cols-2 justify-items-center gap-6 px-6 sm:grid-cols-3 md:grid-cols-5 lg:px-12">
            {RETAILERS.map((r) => (
              <LogoTile key={r.name} retailer={r} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <Marquee
              items={RETAILERS}
              renderItem={(r) => <LogoTile retailer={r} />}
              separator={null}
              gapClassName="gap-6"
              duration={BASE_DURATION_ROW_1 * multiplier}
            />
            <Marquee
              items={RETAILERS}
              renderItem={(r) => <LogoTile retailer={r} />}
              separator={null}
              gapClassName="gap-6"
              duration={BASE_DURATION_ROW_2 * multiplier}
              reverse
            />
          </div>
        )}
      </div>

      <div className="mx-auto mt-12 max-w-container px-6 lg:px-12">
        <p className="text-xs text-fg/40">
          Trademarks and logos belong to their respective owners. Deltra Logistics is not affiliated with or
          endorsed by these retailers.
        </p>
      </div>
    </section>
  );
}
