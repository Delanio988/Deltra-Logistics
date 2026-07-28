"use client";

import { motion, type Variants } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

type SplitTextProps = {
  text: string;
  className?: string;
  /** Delay (s) before the first word starts revealing — lets a label/eyebrow animate first. */
  startDelay?: number;
  as?: "h1" | "h2" | "p";
  /** Words (matched case-insensitively, ignoring trailing punctuation) to render in `highlightClassName`. */
  highlightWords?: string[];
  /** Class applied to matched words. Defaults to accent red. */
  highlightClassName?: string;
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

function isHighlighted(w: string, highlightWords: string[]): boolean {
  const stripped = w.replace(/[.,!?]+$/, "").toLowerCase();
  return highlightWords.some((hw) => hw.toLowerCase() === stripped);
}

/**
 * Splits `text` into words and reveals them with a masked upward slide,
 * staggered word-by-word. Runs once on mount (hero load-in), not on scroll.
 * Words listed in `highlightWords` render in `highlightClassName` in both
 * the animated and reduced-motion paths.
 */
export default function SplitText({
  text,
  className,
  startDelay = 0,
  as = "h1",
  highlightWords,
  highlightClassName = "text-accent",
}: SplitTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(" ");
  const Tag = motion[as];

  if (prefersReducedMotion) {
    const StaticTag = as;
    return (
      <StaticTag className={className} aria-label={text}>
        {words.map((w, i) => (
          <span key={i} className={highlightWords && isHighlighted(w, highlightWords) ? highlightClassName : undefined}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </StaticTag>
    );
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
        <span key={i}>
          <span className="inline-block overflow-hidden pb-[0.1em] align-bottom" aria-hidden="true">
            <motion.span
              className={cn("inline-block", highlightWords && isHighlighted(w, highlightWords) && highlightClassName)}
              variants={word}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
