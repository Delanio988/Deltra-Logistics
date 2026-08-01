"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

type NavPillIndicatorProps = {
  /** Distinct per nav (e.g. "marketing-nav-pill" vs "admin-nav-pill") so
   *  separate headers never share a glide animation. */
  layoutId: string;
  /** True when the pill represents the active page (filled accent) rather
   *  than a temporary hover/focus target (subtle surface tone). */
  active: boolean;
};

/**
 * The sliding highlight behind nav links. Only one instance should be
 * mounted at a time per `layoutId` — under whichever link is the current
 * hover/focus/active target — so Framer Motion glides it between links
 * instead of fading independent copies in/out.
 */
export default function NavPillIndicator({ layoutId, active }: NavPillIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.span
      aria-hidden
      layoutId={layoutId}
      className={cn(
        "absolute inset-0 -z-10 rounded-full transition-colors duration-300",
        active ? "bg-accent" : "bg-surface"
      )}
      transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 30 }}
    />
  );
}
