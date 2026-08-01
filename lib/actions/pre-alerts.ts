"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/actions/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyCustomer } from "@/lib/notify";
import type { Database, TablesInsert } from "@/lib/database.types";

type ActionResult = { success: true } | { success: false; error: string };

const uploadedFileSchema = z.object({
  name: z.string().min(1),
  size: z.number().positive(),
  type: z.string().min(1),
  storagePath: z.string().min(1),
});

// Loosely typed here (not z.enum(PRE_ALERT_CURRENCIES)) — same convention as
// invoices.ts's currency field, since the DB check constraint is the real
// enforcement and the client <select> only ever offers valid values anyway.
const preAlertFieldsSchema = {
  merchant: z.string().min(1),
  trackingNumber: z.string().min(1),
  description: z.string().min(1),
  declaredValue: z.number().positive(),
  currency: z.string().min(1),
};

async function removePreAlertFileObjects(supabase: SupabaseClient<Database>, storagePaths: string[]) {
  if (storagePaths.length > 0) {
    await supabase.storage.from("pre-alert-files").remove(storagePaths);
  }
}

// ============================================================
// Customer-facing actions
// ============================================================

const createPreAlertSchema = z.object({
  ...preAlertFieldsSchema,
  file: uploadedFileSchema.optional(),
});

export async function createPreAlert(input: z.infer<typeof createPreAlertSchema>): Promise<ActionResult> {
  const parsed = createPreAlertSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid pre-alert details." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const limit = await checkRateLimit("submit-pre-alert", user.id, { requests: 20, window: "1 m" });
  if (!limit.success) return { success: false, error: limit.error };

  const insertPayload: TablesInsert<"pre_alerts"> = {
    customer_id: user.id,
    merchant: parsed.data.merchant,
    tracking_number: parsed.data.trackingNumber,
    description: parsed.data.description,
    declared_value: parsed.data.declaredValue,
    currency: parsed.data.currency,
  };
  const { data: created, error } = await supabase.from("pre_alerts").insert(insertPayload).select("id").single();
  if (error) return { success: false, error: error.message };

  if (parsed.data.file) {
    const { error: fileError } = await supabase.from("pre_alert_files").insert({
      pre_alert_id: created.id,
      name: parsed.data.file.name,
      size: parsed.data.file.size,
      mime_type: parsed.data.file.type,
      storage_path: parsed.data.file.storagePath,
    });
    if (fileError) return { success: false, error: fileError.message };
  }

  revalidatePath("/dashboard/pre-alerts");
  revalidatePath("/dashboard");
  revalidatePath("/admin/pre-alerts");
  revalidatePath("/admin");
  return { success: true };
}

const updatePreAlertSchema = z.object({
  id: z.string().uuid(),
  ...preAlertFieldsSchema,
  newFile: uploadedFileSchema.optional(),
  removedFileIds: z.array(z.string().uuid()).optional(),
});

/** Relies on the pre_alerts_update_own_while_pending RLS policy to enforce
 *  "only while still Awaiting Arrival" at the DB level — this action doesn't
 *  re-check status itself; Postgres rejects the update once a pre-alert has
 *  already been matched. */
export async function updatePreAlert(input: z.infer<typeof updatePreAlertSchema>): Promise<ActionResult> {
  const parsed = updatePreAlertSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid pre-alert details." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const limit = await checkRateLimit("submit-pre-alert", user.id, { requests: 20, window: "1 m" });
  if (!limit.success) return { success: false, error: limit.error };

  const { error } = await supabase
    .from("pre_alerts")
    .update({
      merchant: parsed.data.merchant,
      tracking_number: parsed.data.trackingNumber,
      description: parsed.data.description,
      declared_value: parsed.data.declaredValue,
      currency: parsed.data.currency,
    })
    .eq("id", parsed.data.id);
  if (error) return { success: false, error: error.message };

  if (parsed.data.removedFileIds && parsed.data.removedFileIds.length > 0) {
    const { data: filesToRemove } = await supabase
      .from("pre_alert_files")
      .select("id, storage_path")
      .in("id", parsed.data.removedFileIds);
    await removePreAlertFileObjects(
      supabase,
      (filesToRemove ?? []).map((f) => f.storage_path)
    );
    await supabase.from("pre_alert_files").delete().in("id", parsed.data.removedFileIds);
  }

  if (parsed.data.newFile) {
    const { error: fileError } = await supabase.from("pre_alert_files").insert({
      pre_alert_id: parsed.data.id,
      name: parsed.data.newFile.name,
      size: parsed.data.newFile.size,
      mime_type: parsed.data.newFile.type,
      storage_path: parsed.data.newFile.storagePath,
    });
    if (fileError) return { success: false, error: fileError.message };
  }

  revalidatePath("/dashboard/pre-alerts");
  return { success: true };
}

const deletePreAlertSchema = z.object({ id: z.string().uuid() });

/** RLS's existing pre_alerts_delete_own_or_admin policy already supports
 *  this as-is (no new policy needed) — Storage objects are cleaned up here
 *  first since deleting the row alone would orphan them. */
export async function deletePreAlert(input: z.infer<typeof deletePreAlertSchema>): Promise<ActionResult> {
  const parsed = deletePreAlertSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const supabase = await createClient();
  const { data: files } = await supabase.from("pre_alert_files").select("storage_path").eq("pre_alert_id", parsed.data.id);
  await removePreAlertFileObjects(
    supabase,
    (files ?? []).map((f) => f.storage_path)
  );

  const { error } = await supabase.from("pre_alerts").delete().eq("id", parsed.data.id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/pre-alerts");
  revalidatePath("/dashboard");
  return { success: true };
}

// ============================================================
// Admin-facing actions
// ============================================================

const matchSchema = z.object({
  preAlertId: z.string().uuid(),
  packageId: z.string().uuid(),
});

export async function matchPreAlert(input: z.infer<typeof matchSchema>): Promise<ActionResult> {
  const parsed = matchSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { success: false, error: "Admin access required." };

  const { data: preAlert, error: fetchError } = await supabase
    .from("pre_alerts")
    .select("customer_id, merchant, tracking_number")
    .eq("id", parsed.data.preAlertId)
    .single();
  if (fetchError || !preAlert) return { success: false, error: "Pre-alert not found." };

  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("tracking_number")
    .eq("id", parsed.data.packageId)
    .single();
  if (pkgError || !pkg) return { success: false, error: "Package not found." };

  const { error } = await supabase
    .from("pre_alerts")
    .update({ status: "matched", matched_package_id: parsed.data.packageId })
    .eq("id", parsed.data.preAlertId);
  if (error) return { success: false, error: error.message };

  await notifyCustomer(supabase, {
    customerId: preAlert.customer_id,
    title: "Pre-alert matched",
    body: `Your pre-alert for ${preAlert.tracking_number} (${preAlert.merchant}) has been matched to package ${pkg.tracking_number} — it's now received.`,
  });

  revalidatePath("/admin/pre-alerts");
  revalidatePath("/admin");
  revalidatePath("/dashboard/pre-alerts");
  revalidatePath("/dashboard");
  return { success: true };
}
