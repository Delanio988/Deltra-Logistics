"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/database.types";

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  scope: z.enum(["portal", "public", "both"]).optional(),
  autoScheduleEnabled: z.boolean().optional(),
  selectedThemeId: z.string().optional(),
});

export type UpdateSiteSettingsInput = z.infer<typeof updateSchema>;
type ActionResult = { success: true } | { success: false; error: string };

/** Admin-only in practice — RLS's site_settings_update_admin policy rejects
 *  a non-admin's update, surfaced here as a normal error rather than a
 *  special-cased check, since Postgres is already the real gate. */
export async function updateSiteSettings(input: UpdateSiteSettingsInput): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid settings payload." };
  }

  const supabase = await createClient();
  const dbPayload: TablesUpdate<"site_settings"> = {};
  if (parsed.data.enabled !== undefined) dbPayload.enabled = parsed.data.enabled;
  if (parsed.data.scope !== undefined) dbPayload.scope = parsed.data.scope;
  if (parsed.data.autoScheduleEnabled !== undefined) dbPayload.auto_schedule_enabled = parsed.data.autoScheduleEnabled;
  if (parsed.data.selectedThemeId !== undefined) dbPayload.selected_theme_id = parsed.data.selectedThemeId;

  const { error } = await supabase.from("site_settings").update(dbPayload).eq("id", 1);
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
