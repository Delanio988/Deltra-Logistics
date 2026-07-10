"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

const LenisContext = createContext<Lenis | null>(null);

/** Access the active Lenis instance, e.g. to smooth-scroll to an anchor on nav click. */
export function useLenis() {
  return useContext(LenisContext);
}

export default function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafId = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Respect prefers-reduced-motion: skip Lenis entirely and fall back to
    // native scrolling. ScrollTrigger still works fine off native scroll.
    if (prefersReducedMotion) {
      setLenis(null);
      return;
    }

    const lenisInstance = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
    });

    // Keep ScrollTrigger's scroll position in sync with Lenis's virtual scroll.
    lenisInstance.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker (rather than a separate rAF loop) so both
    // stay perfectly in sync and share the same lag-smoothing behavior.
    const update = (time: number) => {
      lenisInstance.raf(time * 1000);
    };
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    setLenis(lenisInstance);
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __lenis?: Lenis }).__lenis = lenisInstance;
    }

    return () => {
      gsap.ticker.remove(update);
      lenisInstance.destroy();
      setLenis(null);
    };
  }, [prefersReducedMotion]);

  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
