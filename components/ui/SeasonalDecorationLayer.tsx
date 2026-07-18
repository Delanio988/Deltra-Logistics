"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSeasonal } from "@/lib/seasonal-context";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { SeasonalDecorationKind } from "@/lib/seasonal-themes";

const ANIMATION_CLASS: Record<Exclude<SeasonalDecorationKind, "none">, string> = {
  snow: "animate-season-fall",
  confetti: "animate-season-fall",
  bats: "animate-season-drift",
  "flag-accent": "animate-season-drift",
  hearts: "animate-season-float",
  eggs: "animate-season-float",
};

function resolvePageScope(pathname: string): "portal" | "public" | null {
  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/dashboard")) return "portal";
  return "public";
}

type Particle = { id: number; glyph: string; left: number; top: number; delay: number; duration: number; size: number };

function buildParticles(glyphs: string[], count: number): Particle[] {
  if (glyphs.length === 0) return [];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    glyph: glyphs[i % glyphs.length],
    left: Math.random() * 100,
    top: Math.random() * 100,
    // Negative delay so particles are already mid-flight on mount instead
    // of all starting from the same spot together.
    delay: Math.random() * -20,
    duration: 8 + Math.random() * 8,
    size: 14 + Math.random() * 14,
  }));
}

/**
 * Purely decorative, sitewide overlay — pointer-events-none so it never
 * blocks clicks or the custom cursor's document-level hover listeners.
 * Mounted once in the root layout; resolves which scope ("portal"/"public")
 * the current route belongs to and asks the data store what theme (if any)
 * is active for it. Admin routes never get decorations.
 */
export default function SeasonalDecorationLayer() {
  const pathname = usePathname();
  const { getActiveSeasonalTheme } = useSeasonal();
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  // Particle positions use Math.random(), which can't match between the
  // server render and the client's first hydration pass — gating on mount
  // means both render nothing initially (identical output), and particles
  // appear a moment later via a normal post-hydration state update instead
  // of during hydration itself.
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    setIsMobile(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const scope = resolvePageScope(pathname);
  const theme = scope ? getActiveSeasonalTheme(scope) : null;
  const count = prefersReducedMotion ? 6 : isMobile ? 12 : 24;

  // Depend on primitive fields (id/count), not the `theme` object itself —
  // getActiveSeasonalTheme returns a fresh object every render, so keying
  // off it directly would regenerate particles (and restart their
  // animations) on every render instead of only when the theme truly changes.
  const particles = useMemo(() => {
    if (!isMounted || !theme || theme.decoration === "none") return [];
    return buildParticles(theme.particleGlyphs, count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, theme?.id, count]);

  if (!theme || theme.decoration === "none" || particles.length === 0) return null;

  const animationClass = ANIMATION_CLASS[theme.decoration];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[45] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className={prefersReducedMotion ? "absolute" : `absolute ${animationClass}`}
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            fontSize: `${p.size}px`,
            opacity: prefersReducedMotion ? 0.5 : undefined,
            animationDelay: prefersReducedMotion ? undefined : `${p.delay}s`,
            animationDuration: prefersReducedMotion ? undefined : `${p.duration}s`,
          }}
        >
          {p.glyph}
        </span>
      ))}
    </div>
  );
}
