// Seasonal theme types, registry, and pure helpers. Live settings (which
// theme is active, scope, auto-schedule) are read from the real
// `site_settings` table — see lib/settings.ts / lib/actions/settings.ts.
//
// This is a decorative LAYER on top of the existing light/dark mode — it
// never touches the --color-* tokens that back bg-bg/text-fg/etc. Each
// theme's accentVars are separate CSS custom properties consumed only by
// SeasonalGreetingBanner/SeasonalDecorationLayer, so brand red/black and the
// light/dark toggle keep working exactly as before underneath any theme.

export type SeasonalThemeId =
  | "none"
  | "christmas"
  | "halloween"
  | "valentines"
  | "easter"
  | "newyear"
  | "jamaica-independence"
  | "emancipation";

export type SeasonalThemeScope = "portal" | "public" | "both";

export type SeasonalDecorationKind = "none" | "snow" | "bats" | "hearts" | "eggs" | "confetti" | "flag-accent";

export type SeasonalDateRange = {
  startMonth: number; // 1-12
  startDay: number;
  endMonth: number;
  endDay: number;
};

export type SeasonalTheme = {
  id: SeasonalThemeId;
  label: string;
  decoration: SeasonalDecorationKind;
  /** Emoji particles for the decoration overlay — no new image/SVG assets, no licensing concerns. */
  particleGlyphs: string[];
  /** CSS custom properties for THIS theme's banner/decoration only — never overrides --color-*. */
  accentVars?: Record<string, string>;
  /** Dismissible banner message. Themes without one never show a banner. */
  greeting?: string;
  /** Auto-schedule window (inclusive). Handles year-boundary wraparound (e.g. Dec 28 -> Jan 3).
   *  Easter is a movable feast, so its range below is an approximate band — admins can always
   *  override with a manual selection regardless of what auto-schedule would pick. */
  autoRange?: SeasonalDateRange;
};

export type SeasonalSettings = {
  enabled: boolean;
  scope: SeasonalThemeScope;
  autoScheduleEnabled: boolean;
  selectedThemeId: SeasonalThemeId;
};

export const DEFAULT_SEASONAL_SETTINGS: SeasonalSettings = {
  enabled: false,
  scope: "both",
  autoScheduleEnabled: false,
  selectedThemeId: "none",
};

// Registry order also acts as the auto-schedule tiebreaker if two ranges
// were ever made to overlap (resolveAutoSeasonalTheme returns the first
// match) — kept non-overlapping today, but worth knowing for future edits.
export const SEASONAL_THEMES: SeasonalTheme[] = [
  {
    id: "none",
    label: "Default (no theme)",
    decoration: "none",
    particleGlyphs: [],
  },
  {
    id: "christmas",
    label: "Christmas",
    decoration: "snow",
    particleGlyphs: ["❄", "❅", "❆"],
    accentVars: { "--season-accent-1": "31 122 77", "--season-accent-2": "200 30 30" },
    greeting: "🎄 Season's Greetings from Deltra Logistics",
    autoRange: { startMonth: 12, startDay: 1, endMonth: 12, endDay: 26 },
  },
  {
    id: "halloween",
    label: "Halloween",
    decoration: "bats",
    particleGlyphs: ["🦇"],
    accentVars: { "--season-accent-1": "255 101 56", "--season-accent-2": "107 63 160" },
    greeting: "🎃 Spooky season shipping — same reliable service",
    autoRange: { startMonth: 10, startDay: 15, endMonth: 10, endDay: 31 },
  },
  {
    id: "valentines",
    label: "Valentine's Day",
    decoration: "hearts",
    particleGlyphs: ["💕", "💗", "❤"],
    accentVars: { "--season-accent-1": "255 46 46", "--season-accent-2": "255 143 163" },
    greeting: "💌 Sending love (and packages) your way",
    autoRange: { startMonth: 2, startDay: 7, endMonth: 2, endDay: 14 },
  },
  {
    id: "easter",
    label: "Easter",
    decoration: "eggs",
    particleGlyphs: ["🥚", "🌷", "✿"],
    accentVars: { "--season-accent-1": "247 198 217", "--season-accent-2": "201 228 197" },
    greeting: "🐣 Happy Easter from the Deltra team",
    autoRange: { startMonth: 3, startDay: 22, endMonth: 4, endDay: 25 },
  },
  {
    id: "newyear",
    label: "New Year",
    decoration: "confetti",
    particleGlyphs: ["🎉", "✨", "🎊"],
    accentVars: { "--season-accent-1": "255 215 0", "--season-accent-2": "255 101 56" },
    greeting: "🎆 Happy New Year from Deltra Logistics",
    autoRange: { startMonth: 12, startDay: 28, endMonth: 1, endDay: 3 },
  },
  {
    id: "emancipation",
    label: "Emancipation Day",
    decoration: "flag-accent",
    particleGlyphs: ["🇯🇲"],
    accentVars: { "--season-accent-1": "0 0 0", "--season-accent-2": "0 155 58", "--season-accent-3": "254 209 0" },
    greeting: "✊🏾 Emancipation Day — honoring freedom and resilience",
    autoRange: { startMonth: 8, startDay: 1, endMonth: 8, endDay: 2 },
  },
  {
    id: "jamaica-independence",
    label: "Jamaica Independence Day",
    decoration: "flag-accent",
    particleGlyphs: ["🇯🇲"],
    accentVars: { "--season-accent-1": "0 0 0", "--season-accent-2": "0 155 58", "--season-accent-3": "254 209 0" },
    greeting: "🇯🇲 Proud to be Jamaica-based — Happy Independence Day!",
    autoRange: { startMonth: 8, startDay: 5, endMonth: 8, endDay: 7 },
  },
];

export function getSeasonalThemeById(id: SeasonalThemeId): SeasonalTheme {
  return SEASONAL_THEMES.find((t) => t.id === id) ?? SEASONAL_THEMES[0];
}

export function isDateInRange(date: Date, range: SeasonalDateRange): boolean {
  const value = (date.getMonth() + 1) * 100 + date.getDate();
  const start = range.startMonth * 100 + range.startDay;
  const end = range.endMonth * 100 + range.endDay;
  if (start <= end) return value >= start && value <= end;
  // Wraps the year boundary (e.g. Dec 28 -> Jan 3).
  return value >= start || value <= end;
}

export function resolveAutoSeasonalTheme(date: Date): SeasonalTheme {
  const match = SEASONAL_THEMES.find((t) => t.autoRange && isDateInRange(date, t.autoRange));
  return match ?? getSeasonalThemeById("none");
}

/**
 * Single source of truth for "what theme should this page show." Manual
 * selection and auto-schedule are mutually exclusive modes the admin picks
 * explicitly — auto-schedule is never a silent fallback, so "admin manual
 * override always wins" just means the admin has autoScheduleEnabled off.
 */
export function resolveActiveSeasonalTheme(
  settings: SeasonalSettings,
  pageScope: "portal" | "public",
  now: Date
): SeasonalTheme {
  if (!settings.enabled) return getSeasonalThemeById("none");
  if (settings.scope !== "both" && settings.scope !== pageScope) return getSeasonalThemeById("none");
  if (settings.autoScheduleEnabled) return resolveAutoSeasonalTheme(now);
  return getSeasonalThemeById(settings.selectedThemeId);
}

export function isBannerVisible(theme: SeasonalTheme, dismissedThemeId: string | null): boolean {
  return Boolean(theme.greeting) && dismissedThemeId !== theme.id;
}
