"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger index — multiplies delay so siblings cascade in. */
  index?: number;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Distance (px) the element travels while revealing. */
  distance?: number;
  as?: "div" | "li";
};

const directionOffset: Record<NonNullable<ScrollRevealProps["direction"]>, { x?: number; y?: number }> = {
  up: { y: 32 },
  down: { y: -32 },
  left: { x: 32 },
  right: { x: -32 },
  none: {},
};

/**
 * Generic fade/slide-in-on-scroll wrapper. Pass `index` on a list of siblings
 * to get an automatic stagger (each item's delay = index * 0.09s).
 */
export default function ScrollReveal({
  children,
  className,
  index = 0,
  delay = 0,
  direction = "up",
  distance,
  as = "div",
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const offset = directionOffset[direction];
  const scaledOffset = distance
    ? Object.fromEntries(Object.entries(offset).map(([k, v]) => [k, v && v > 0 ? distance : -distance]))
    : offset;

  const variants: Variants = {
    hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, ...scaledOffset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.9,
        delay: delay + index * 0.09,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const MotionTag = as === "li" ? motion.li : motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
