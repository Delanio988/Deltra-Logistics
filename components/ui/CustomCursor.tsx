"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Lightweight trailing ring — it never hides or replaces the native system
 * cursor, only follows alongside it with a light spring lag and grows on
 * hover. That's a deliberate simplification: a full cursor *replacement*
 * (hiding the native cursor and drawing a custom one in its place) kept
 * causing edge cases — misalignment, getting stuck over iframes, breaking
 * the text caret in form fields. Trailing the real cursor instead of
 * replacing it removes that whole class of bugs, since the native cursor is
 * always there doing its normal job. Disabled entirely on touch devices and
 * when prefers-reduced-motion is set.
 */
export default function CustomCursor() {
  const [isTouch, setIsTouch] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  // Hidden until the first real pointer position arrives, and again
  // whenever the pointer leaves the top-level document (e.g. over an
  // iframe, or out of the window) — pointermove never fires in that gap,
  // so without this the ring would otherwise freeze at its last position.
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 26, stiffness: 260, mass: 0.6 };
  const x = useSpring(cursorX, springConfig);
  const y = useSpring(cursorY, springConfig);

  useEffect(() => {
    const touchCapable = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    setIsTouch(touchCapable);
    if (touchCapable || prefersReducedMotion) return;

    const handleMove = (e: PointerEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsVisible(true);
    };

    const handleOver = (e: Event) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor-hover]");
      if (target) setIsHovering(true);
    };

    const handleOut = (e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor-hover]");
      if (target) setIsHovering(false);
      // relatedTarget is null exactly when the pointer left the document
      // entirely, rather than just moving to a different element within it.
      if (!e.relatedTarget) setIsVisible(false);
    };

    window.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerover", handleOver);
    document.addEventListener("pointerout", handleOut);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerover", handleOver);
      document.removeEventListener("pointerout", handleOut);
    };
  }, [cursorX, cursorY, prefersReducedMotion]);

  if (isTouch || prefersReducedMotion) return null;

  return (
    <motion.div
      aria-hidden
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none fixed left-0 top-0 z-[70]"
      style={{ x, y, translateX: "-50%", translateY: "-50%" }}
    >
      <motion.div
        animate={{
          width: isHovering ? 46 : 26,
          height: isHovering ? 46 : 26,
          opacity: isHovering ? 1 : 0.55,
          backgroundColor: isHovering ? "rgba(255,46,46,0.12)" : "rgba(255,46,46,0)",
        }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        className="rounded-full border-2 border-accent"
      />
    </motion.div>
  );
}
