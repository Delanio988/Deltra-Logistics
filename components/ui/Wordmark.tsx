"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";
import logoFull from "@/public/deltra-logo.png";
import logoFullOnDark from "@/public/deltra-logo-ondark.png";
import logoMark from "@/public/deltra-mark.png";
import logoMarkOnDark from "@/public/deltra-mark-ondark.png";

type WordmarkProps = {
  /** Controls the rendered height — pass a Tailwind height utility, e.g. "h-8". Width follows automatically (aspect ratio is preserved). */
  className?: string;
  /** Show the icon-only "D" mark below the `lg` breakpoint instead of the full lockup — for cramped nav bars only. */
  responsive?: boolean;
  /** Play the load-in + hover micro-interactions. Reserved for the primary nav logo. */
  animated?: boolean;
  /**
   * Skip automatic light/dark detection and force a specific asset variant.
   * Use "onDark" for placements that sit on a permanently-dark background
   * regardless of the site's theme (e.g. the signup page's decorative visual
   * panel) — everywhere else should omit this and let it follow the theme.
   */
  forceVariant?: "onDark" | "onLight";
};

/**
 * Single source of truth for the brand logo. The "LOGISTICS" wordmark (and
 * part of the "D" mark) is pure black in the source art, so it needs a
 * light-colored variant to read on dark backgrounds — this picks the right
 * one automatically based on the active theme.
 */
export default function Wordmark({ className, responsive = false, animated = false, forceVariant }: WordmarkProps) {
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Before mount, next-themes hasn't resolved the real theme yet — default to
  // the "onDark" variant, matching the site's defaultTheme="dark", so there's
  // no visible flash for the common case. Resolves within a frame either way.
  const isDark = forceVariant ? forceVariant === "onDark" : !mounted || resolvedTheme !== "light";

  const playMotion = animated && !prefersReducedMotion;
  const imageClassName = cn("w-auto object-contain", className);
  const fullSrc = isDark ? logoFullOnDark : logoFull;
  const markSrc = isDark ? logoMarkOnDark : logoMark;

  const image = (
    <>
      <Image
        src={fullSrc}
        alt="Deltra Logistics"
        priority
        className={cn(imageClassName, responsive && "hidden lg:block")}
      />
      {responsive && (
        <Image src={markSrc} alt="Deltra Logistics" priority className={cn(imageClassName, "lg:hidden")} />
      )}
    </>
  );

  if (!animated) {
    return <span className="inline-flex items-center">{image}</span>;
  }

  return (
    <motion.span
      className="inline-flex items-center"
      initial={playMotion ? { opacity: 0, scale: 0.96 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={playMotion ? { scale: 1.03 } : undefined}
    >
      {image}
    </motion.span>
  );
}
