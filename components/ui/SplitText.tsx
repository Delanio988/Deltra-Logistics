"use client";

import { motion, type Variants } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

type SplitTextProps = {
  text: string;
  className?: string;
  /** Delay (s) before the first word starts revealing — lets a label/eyebrow animate first. */
  startDelay?: number;
  as?: "h1" | "h2" | "p";
};

const container: Variants = {
  hidden: {},
  visible: (startDelay: number) => ({
    transition: { staggerChildren: 0.08, delayChildren: startDelay },
  }),
};

const word: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Splits `text` into words and reveals them with a masked upward slide,
 * staggered word-by-word. Runs once on mount (hero load-in), not on scroll.
 */
export default function SplitText({ text, className, startDelay = 0, as = "h1" }: SplitTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(" ");
  const Tag = motion[as];

  if (prefersReducedMotion) {
    const StaticTag = as;
    return <StaticTag className={className}>{text}</StaticTag>;
  }

  return (
    <Tag
      className={className}
      initial="hidden"
      animate="visible"
      variants={container}
      custom={startDelay}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom" aria-hidden="true">
          <motion.span className="inline-block" variants={word}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
