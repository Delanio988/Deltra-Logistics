"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

const SunIcon = (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="4.5" />
    <path
      d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type ThemeToggleProps = {
  className?: string;
};

/**
 * Sun/moon theme toggle. Icon shows the *current* theme (moon while dark,
 * sun while light); the aria-label describes what clicking will do. Guards
 * against next-themes' hydration gotcha (theme is unknown until mounted) by
 * reserving the same footprint rather than guessing.
 */
export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span aria-hidden className={cn("inline-block h-10 w-10", className)} />;
  }

  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      data-cursor-hover="Theme"
      className={cn(
        "relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-fg/15 text-fg transition-colors duration-200 hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: prefersReducedMotion ? 0.12 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex"
        >
          {isDark ? MoonIcon : SunIcon}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
