import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database, Tables } from "@/lib/database.types";
import type { Invoice, InvoiceFile, InvoiceStatus, InvoiceStatusHistoryEntry } from "@/lib/invoices";

export type InvoiceWithCustomer = Invoice & { customerName: string };

// Signed URLs are short-lived by design — re-generated on every page load,
// never persisted, matching the private bucket's whole point.
const SIGNED_URL_EXPIRY_SECONDS = 60 * 10;

function formatDbDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

async function mapFiles(
  supabase: SupabaseClient<Database>,
  files: Tables<"invoice_files">[]
): Promise<InvoiceFile[]> {
  return Promise.all(
    files.map(async (f) => {
      const { data } = await supabase.storage.from("invoice-files").createSignedUrl(f.storage_path, SIGNED_URL_EXPIRY_SECONDS);
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

function mapHistory(rows: Tables<"invoice_status_history">[]): InvoiceStatusHistoryEntry[] {
  return rows.map((r) => ({ status: r.status as InvoiceStatus, at: formatDbDate(r.at), note: r.note ?? undefined }));
}

async function mapInvoiceRow(
  supabase: SupabaseClient<Database>,
  row: Tables<"invoices">,
  accountCode: string
): Promise<Invoice> {
  const [{ data: files }, { data: history }] = await Promise.all([
    supabase.from("invoice_files").select("*").eq("invoice_id", row.id).order("uploaded_at", { ascending: true }),
    supabase.from("invoice_status_history").select("*").eq("invoice_id", row.id).order("at", { ascending: true }),
  ]);

  return {
    id: row.id,
    packageId: row.package_id,
    accountCode,
    files: await mapFiles(supabase, files ?? []),
    merchant: row.merchant ?? undefined,
    value: row.value ?? undefined,
    currency: row.currency ?? undefined,
    status: row.status as InvoiceStatus,
    rejectionReason: row.rejection_reason ?? undefined,
    submittedAt: formatDbDate(row.submitted_at),
    reviewedAt: row.reviewed_at ? formatDbDate(row.reviewed_at) : undefined,
    updatedAt: row.updated_at ? formatDbDate(row.updated_at) : undefined,
    hasUnreviewedChanges: row.has_unreviewed_changes,
    statusHistory: mapHistory(history ?? []),
  };
}

/** RLS scopes this to the caller's own invoices — no explicit filter needed. */
export async function getInvoicesForCurrentUser(): Promise<Invoice[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase.from("profiles").select("account_code").eq("id", user.id).single();
  const accountCode = profile?.account_code ?? "";

  const { data, error } = await supabase.from("invoices").select("*").order("submitted_at", { ascending: false });
  if (error) throw new Error(error.message);

  return Promise.all((data ?? []).map((row) => mapInvoiceRow(supabase, row, accountCode)));
}

/** Admin view — every invoice, with the owning customer's name + account code. */
export async function getAllInvoicesWithCustomer(): Promise<InvoiceWithCustomer[]> {
  const supabase = await createClient();
  // invoices has two FKs into profiles (customer_id and reviewed_by), so the
  // embed needs an explicit hint to resolve which relationship to follow.
  const { data, error } = await supabase
    .from("invoices")
    .select("*, profiles!invoices_customer_id_fkey(first_name, last_name, account_code)")
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(error.message);

  return Promise.all(
    (data ?? []).map(async (row) => {
      const profile = row.profiles;
      const accountCode = profile?.account_code ?? "";
      const customerName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : accountCode;
      const invoice = await mapInvoiceRow(supabase, row, accountCode);
      return { ...invoice, customerName };
    })
  );
}
