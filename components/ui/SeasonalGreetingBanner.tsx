"use client";

import { useDataStore } from "@/lib/data-store";
import { cn } from "@/lib/utils";

const CloseIcon = (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
  </svg>
);

type SeasonalGreetingBannerProps = {
  scope: "portal" | "public";
  className?: string;
};

/**
 * Dismissible festive ribbon — purely presentational, no positioning of its
 * own. Where it's mounted (and how) differs by scope because the two areas'
 * headers are laid out differently: inside Header.tsx's fixed box for
 * "public" (so the fixed header simply grows to fit it, no offset math),
 * and as a plain sibling before DashboardHeader's static header for
 * "portal" (so it naturally pushes the header down).
 */
export default function SeasonalGreetingBanner({ scope, className }: SeasonalGreetingBannerProps) {
  const { getActiveSeasonalTheme, isSeasonalBannerVisible, dismissSeasonalBanner } = useDataStore();

  const theme = getActiveSeasonalTheme(scope);
  if (!theme.greeting || !isSeasonalBannerVisible(scope)) return null;

  const vars = theme.accentVars ?? {};
  const stops = [vars["--season-accent-1"], vars["--season-accent-2"], vars["--season-accent-3"]]
    .filter((v): v is string => Boolean(v))
    .map((v) => `rgb(${v} / 0.85)`);
  const background = stops.length >= 2 ? `linear-gradient(90deg, ${stops.join(", ")})` : undefined;

  return (
    <div
      role="status"
      className={cn(
        "flex h-11 items-center justify-center gap-3 px-4 text-center text-xs font-semibold text-white",
        !background && "bg-accent",
        className
      )}
      style={background ? { background } : undefined}
    >
      <span className="truncate">{theme.greeting}</span>
      <button
        type="button"
        onClick={() => dismissSeasonalBanner(theme.id)}
        aria-label="Dismiss"
        data-cursor-hover="Dismiss"
        className="flex shrink-0 items-center justify-center rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        {CloseIcon}
      </button>
    </div>
  );
}
