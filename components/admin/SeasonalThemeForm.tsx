"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSiteSettings } from "@/lib/actions/settings";
import { SEASONAL_THEMES, resolveAutoSeasonalTheme, type SeasonalSettings, type SeasonalThemeScope } from "@/lib/seasonal-themes";
import Toast from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type SeasonalThemeFormProps = {
  initialSettings: SeasonalSettings;
};

const SCOPE_OPTIONS: { value: SeasonalThemeScope; label: string }[] = [
  { value: "portal", label: "Customer Portal" },
  { value: "public", label: "Public Site" },
  { value: "both", label: "Both" },
];

function ToggleSwitch({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      data-cursor-hover="Toggle"
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        checked ? "bg-accent" : "bg-fg/15"
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

/**
 * Admin control for the sitewide seasonal decoration layer — a decorative
 * add-on to the existing light/dark mode, never a replacement for it. Every
 * control applies instantly via local state, then persists through the
 * updateSiteSettings server action and re-syncs everyone else's next
 * navigation via revalidatePath — no Save button, matching the original UX.
 */
export default function SeasonalThemeForm({ initialSettings }: SeasonalThemeFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const todayTheme = resolveAutoSeasonalTheme(new Date());

  const applyChange = async (partial: Partial<SeasonalSettings>, message: string) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    setToastMessage(message);
    const result = await updateSiteSettings(partial);
    if (!result.success) {
      // Roll back the optimistic update and let the admin know it didn't stick.
      setSettings(initialSettings);
      setToastMessage(`Couldn't save: ${result.error}`);
      return;
    }
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-fg/8 bg-surface p-6 shadow-card sm:p-8">
      <h3 className="text-sm font-bold text-fg">Seasonal Theme</h3>
      <p className="mt-1 text-xs text-fg/50">
        Layer festive decorations and a greeting banner on top of the site&rsquo;s normal look — the core
        red/black brand stays underneath in both themes.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-fg/10 bg-fg/5 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-fg">Seasonal theme</p>
          <p className="text-xs text-fg/50">Turn decorations and the greeting banner on or off.</p>
        </div>
        <ToggleSwitch
          checked={settings.enabled}
          label="Seasonal theme"
          onToggle={() =>
            applyChange({ enabled: !settings.enabled }, settings.enabled ? "Seasonal theme turned off." : "Seasonal theme turned on.")
          }
        />
      </div>

      <div className="mt-5">
        <label className="text-xs font-semibold uppercase tracking-widest text-fg/50">Scope</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {SCOPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => applyChange({ scope: opt.value }, `Scope set to ${opt.label}.`)}
              data-cursor-hover={opt.label}
              className={cn(
                "min-h-11 rounded-full border px-3 py-2.5 text-xs font-semibold transition-colors",
                settings.scope === opt.value
                  ? "border-accent bg-accent/10 text-accent-text"
                  : "border-fg/15 text-fg/70 hover:border-accent hover:text-accent"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-fg/10 bg-fg/5 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-fg">Auto-schedule by date</p>
          <p className="text-xs text-fg/50">Let each theme&rsquo;s date range turn it on automatically.</p>
        </div>
        <ToggleSwitch
          checked={settings.autoScheduleEnabled}
          label="Auto-schedule by date"
          onToggle={() =>
            applyChange(
              { autoScheduleEnabled: !settings.autoScheduleEnabled },
              settings.autoScheduleEnabled ? "Auto-schedule turned off." : "Auto-schedule turned on."
            )
          }
        />
      </div>

      {settings.autoScheduleEnabled ? (
        <div className="mt-5 rounded-xl border border-fg/10 bg-fg/5 px-5 py-4 text-sm text-fg/70">
          Today&rsquo;s auto-selected theme: <span className="font-semibold text-fg">{todayTheme.label}</span>
        </div>
      ) : (
        <div className="mt-5">
          <label className="text-xs font-semibold uppercase tracking-widest text-fg/50">Theme</label>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SEASONAL_THEMES.map((theme) => {
              const vars = theme.accentVars ?? {};
              const stops = [vars["--season-accent-1"], vars["--season-accent-2"], vars["--season-accent-3"]]
                .filter((v): v is string => Boolean(v))
                .map((v) => `rgb(${v})`);
              const swatch = stops.length > 0 ? `linear-gradient(135deg, ${stops.join(", ")})` : undefined;
              const selected = settings.selectedThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => applyChange({ selectedThemeId: theme.id }, `${theme.label} selected.`)}
                  data-cursor-hover={theme.label}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                    selected ? "border-accent bg-accent/10" : "border-fg/15 hover:border-accent"
                  )}
                >
                  <span
                    aria-hidden
                    className="h-8 w-full rounded-lg border border-fg/10"
                    style={{ background: swatch ?? "rgb(var(--color-fg) / 0.08)" }}
                  />
                  <span className="text-xs font-semibold text-fg">{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
