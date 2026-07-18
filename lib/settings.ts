import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SEASONAL_SETTINGS, type SeasonalSettings, type SeasonalThemeId, type SeasonalThemeScope } from "@/lib/seasonal-themes";

/** Server-only — reads the singleton site_settings row. Readable by anon too
 *  (see the Phase 1 RLS policy), since the public marketing site needs this
 *  with no session at all. */
export async function getSiteSettings(): Promise<SeasonalSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  if (!data) return DEFAULT_SEASONAL_SETTINGS;

  return {
    enabled: data.enabled,
    scope: data.scope as SeasonalThemeScope,
    autoScheduleEnabled: data.auto_schedule_enabled,
    selectedThemeId: data.selected_theme_id as SeasonalThemeId,
  };
}
