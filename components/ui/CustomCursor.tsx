"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Custom cursor that follows the pointer with a light spring lag, and grows
 * (with a label) when hovering any element marked [data-cursor-hover].
 * Disabled entirely on touch devices and when prefers-reduced-motion is set.
 */
export default function CustomCursor() {
  const [isTouch, setIsTouch] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 28, stiffness: 380, mass: 0.5 };
  const x = useSpring(cursorX, springConfig);
  const y = useSpring(cursorY, springConfig);

  const rafPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const touchCapable = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    setIsTouch(touchCapable);
    if (touchCapable || prefersReducedMotion) return;

    document.documentElement.classList.add("has-custom-cursor");

    const handleMove = (e: PointerEvent) => {
      rafPos.current = { x: e.clientX, y: e.clientY };
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleOver = (e: Event) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor-hover]");
      if (target) {
        setIsHovering(true);
        setHoverLabel(target.dataset.cursorHover || null);
      }
    };

    const handleOut = (e: Event) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor-hover]");
      if (target) {
        setIsHovering(false);
        setHoverLabel(null);
      }
    };

    window.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerover", handleOver);
    document.addEventListener("pointerout", handleOut);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerover", handleOver);
      document.removeEventListener("pointerout", handleOut);
    };
  }, [cursorX, cursorY, prefersReducedMotion]);

  if (isTouch || prefersReducedMotion) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[70] mix-blend-difference"
      style={{ x, y, translateX: "-50%", translateY: "-50%" }}
    >
      <motion.div
        animate={{
          width: isHovering ? 88 : 16,
          height: isHovering ? 88 : 16,
        }}
        transition={{ type: "spring", damping: 24, stiffness: 320 }}
        className="flex items-center justify-center rounded-full bg-white"
      >
        {isHovering && hoverLabel && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-navy-950">
            {hoverLabel}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
