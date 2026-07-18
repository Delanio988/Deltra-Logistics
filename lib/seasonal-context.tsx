"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  isBannerVisible,
  resolveActiveSeasonalTheme,
  type SeasonalSettings,
  type SeasonalTheme,
  type SeasonalThemeScope,
} from "@/lib/seasonal-themes";

type SeasonalContextValue = {
  seasonalSettings: SeasonalSettings;
  getActiveSeasonalTheme: (pageScope: Exclude<SeasonalThemeScope, "both">) => SeasonalTheme;
  isSeasonalBannerVisible: (pageScope: Exclude<SeasonalThemeScope, "both">) => boolean;
  dismissSeasonalBanner: (themeId: string) => void;
};

const SeasonalContext = createContext<SeasonalContextValue | null>(null);

// sessionStorage (not localStorage): "dismissed for their session" should
// survive a refresh but not a new tab/browser session.
const BANNER_DISMISSED_KEY = "deltra_seasonal_banner_dismissed";

/**
 * Thin client wrapper around a server-fetched `site_settings` row (see
 * lib/settings.ts). The row itself is real and shared across everyone; only
 * "did I personally dismiss today's banner" stays client-side, since that's
 * session UI state, not durable data — see the Phase 2 plan for why.
 */
export function SeasonalProvider({
  initialSettings,
  children,
}: {
  initialSettings: SeasonalSettings;
  children: ReactNode;
}) {
  const [bannerDismissedThemeId, setBannerDismissedThemeId] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(BANNER_DISMISSED_KEY);
    if (stored) setBannerDismissedThemeId(stored);
  }, []);

  const getActiveSeasonalTheme = (pageScope: Exclude<SeasonalThemeScope, "both">) =>
    resolveActiveSeasonalTheme(initialSettings, pageScope, new Date());

  const isSeasonalBannerVisible = (pageScope: Exclude<SeasonalThemeScope, "both">) =>
    isBannerVisible(getActiveSeasonalTheme(pageScope), bannerDismissedThemeId);

  const dismissSeasonalBanner = (themeId: string) => {
    setBannerDismissedThemeId(themeId);
    window.sessionStorage.setItem(BANNER_DISMISSED_KEY, themeId);
  };

  return (
    <SeasonalContext.Provider
      value={{ seasonalSettings: initialSettings, getActiveSeasonalTheme, isSeasonalBannerVisible, dismissSeasonalBanner }}
    >
      {children}
    </SeasonalContext.Provider>
  );
}

export function useSeasonal() {
  const ctx = useContext(SeasonalContext);
  if (!ctx) throw new Error("useSeasonal must be used within a SeasonalProvider");
  return ctx;
}
