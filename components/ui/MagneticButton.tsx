"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useLenis } from "@/components/layout/SmoothScrollProvider";
import { cn } from "@/lib/utils";

type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  cursorLabel?: string;
  /** How strongly the button follows the cursor within its bounds (0-1). */
  strength?: number;
  /** Only used when rendering as a <button> (no href), e.g. "submit". */
  type?: "button" | "submit";
  disabled?: boolean;
};

/**
 * Wraps a button/link so it subtly "pulls" toward the cursor when nearby,
 * then springs back to rest on mouse leave. Pure translate transform — no
 * layout shift, so it's cheap to animate every frame.
 */
export default function MagneticButton({
  children,
  className,
  href,
  onClick,
  cursorLabel = "View",
  strength = 0.35,
  type = "button",
  disabled = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const lenis = useLenis();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 18, stiffness: 220, mass: 0.6 });
  const springY = useSpring(y, { damping: 18, stiffness: 220, mass: 0.6 });

  const handleMouseMove = (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (prefersReducedMotion || disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * strength);
    y.set(relY * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Anchor links (#services, #contact, ...) route through Lenis so they get
  // the same smooth-scroll easing as the header nav, instead of a hard jump.
  const handleClick = (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.();
    if (href?.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (!target) return;
      if (lenis) {
        lenis.scrollTo(target as HTMLElement, { offset: -88, duration: 1.4 });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const Component = motion.create(href ? "a" : "button");

  return (
    <Component
      ref={ref as never}
      href={href}
      type={href ? undefined : type}
      disabled={href ? undefined : disabled}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      data-cursor-hover={cursorLabel}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-8 py-4 text-sm font-semibold tracking-wide transition-colors duration-300 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </Component>
  );
}
