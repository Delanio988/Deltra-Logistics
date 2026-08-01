import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database, Tables } from "@/lib/database.types";
import type { PackageStatus } from "@/lib/dashboard-data";
import type { PreAlert, PreAlertFile, PreAlertStatus, PreAlertWithCustomer, UnmatchedPackageForMatching } from "@/lib/pre-alerts";

// Signed URLs are short-lived by design — re-generated on every page load,
// never persisted, matching the private bucket's whole point.
const SIGNED_URL_EXPIRY_SECONDS = 60 * 10;

function formatDbDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

async function mapFiles(supabase: SupabaseClient<Database>, files: Tables<"pre_alert_files">[]): Promise<PreAlertFile[]> {
  return Promise.all(
    files.map(async (f) => {
      const { data } = await supabase.storage.from("pre-alert-files").createSignedUrl(f.storage_path, SIGNED_URL_EXPIRY_SECONDS);
      return {
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.mime_type,
        storagePath: f.storage_path,
        url: data?.signedUrl,
        uploadedAt: formatDbDate(f.uploaded_at),
      };
    })
  );
}

async function mapPreAlertRow(supabase: SupabaseClient<Database>, row: Tables<"pre_alerts">): Promise<PreAlert> {
  const { data: files } = await supabase
    .from("pre_alert_files")
    .select("*")
    .eq("pre_alert_id", row.id)
    .order("uploaded_at", { ascending: true });

  return {
    id: row.id,
    merchant: row.merchant,
    trackingNumber: row.tracking_number,
    description: row.description ?? "",
    declaredValue: row.declared_value ?? undefined,
    currency: row.currency ?? undefined,
    status: row.status as PreAlertStatus,
    matchedPackageId: row.matched_package_id ?? undefined,
    createdAt: formatDbDate(row.created_at),
    files: await mapFiles(supabase, files ?? []),
  };
}

/** RLS scopes this to the caller's own rows — no explicit filter needed.
 *  A query error degrades to an empty list rather than crashing the page
 *  render, same defensive pattern as getPackagesForCurrentUser. */
export async function getPreAlertsForCurrentUser(): Promise<PreAlert[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pre_alerts").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[getPreAlertsForCurrentUser]", error.message);
    return [];
  }

  return Promise.all((data ?? []).map((row) => mapPreAlertRow(supabase, row)));
}

/** Admin queue — every pending pre-alert, oldest first, with the owning
 *  customer's display name for the matching UI. */
export async function getAllPendingPreAlertsWithCustomer(): Promise<PreAlertWithCustomer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pre_alerts")
    .select("*, profiles!pre_alerts_customer_id_fkey(first_name, last_name, account_code)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[getAllPendingPreAlertsWithCustomer]", error.message);
    return [];
  }

  return Promise.all(
    (data ?? []).map(async (row) => {
      const profile = row.profiles;
      const accountCode = profile?.account_code ?? "";
      const customerName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : accountCode;
      const preAlert = await mapPreAlertRow(supabase, row);
      return { ...preAlert, customerId: row.customer_id, customerName, accountCode };
    })
  );
}

/** Packages not yet linked to any pre-alert, for the admin's match picker —
 *  the unique constraint on pre_alerts.matched_package_id means a package
 *  can satisfy at most one pre-alert, so already-matched packages are
 *  filtered out here rather than left for the UI to notice. */
export async function getUnmatchedPackagesForMatching(): Promise<UnmatchedPackageForMatching[]> {
  const supabase = await createClient();
  const { data: matched } = await supabase
    .from("pre_alerts")
    .select("matched_package_id")
    .not("matched_package_id", "is", null);
  const matchedIds = (matched ?? []).map((r) => r.matched_package_id as string);

  let query = supabase
    .from("packages")
    .select(
      "id, customer_id, tracking_number, merchant, description, weight_lb, status, profiles!packages_customer_id_fkey(account_code)"
    )
    .order("date_received", { ascending: false });
  if (matchedIds.length > 0) {
    query = query.not("id", "in", `(${matchedIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getUnmatchedPackagesForMatching]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    accountCode: row.profiles?.account_code ?? "",
    trackingNumber: row.tracking_number,
    merchant: row.merchant,
    description: row.description,
    weightLb: row.weight_lb,
    status: row.status as PackageStatus,
  }));
}
