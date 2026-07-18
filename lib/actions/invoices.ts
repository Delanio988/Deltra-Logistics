"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/actions/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyCustomer } from "@/lib/notify";
import type { Database, TablesInsert, TablesUpdate } from "@/lib/database.types";
import type { Invoice, InvoiceStatus } from "@/lib/invoices";

type ActionResult = { success: true } | { success: false; error: string };

const uploadedFileSchema = z.object({
  name: z.string().min(1),
  size: z.number().positive(),
  type: z.string().min(1),
  storagePath: z.string().min(1),
});

async function deleteInvoiceFilesForInvoice(supabase: SupabaseClient<Database>, invoiceId: string) {
  const { data: files } = await supabase.from("invoice_files").select("storage_path").eq("invoice_id", invoiceId);
  if (files && files.length > 0) {
    await supabase.storage.from("invoice-files").remove(files.map((f) => f.storage_path));
  }
  await supabase.from("invoice_files").delete().eq("invoice_id", invoiceId);
}

/** Looks up who owns an invoice's package and its tracking number, for
 *  building the customer-facing notification copy every mutation sends. */
async function getInvoiceOwnerContext(supabase: SupabaseClient<Database>, invoiceId: string) {
  const { data } = await supabase
    .from("invoices")
    .select("customer_id, packages(tracking_number)")
    .eq("id", invoiceId)
    .single();
  return { customerId: data?.customer_id, trackingNumber: data?.packages?.tracking_number ?? "your package" };
}

async function getPackageOwnerContext(supabase: SupabaseClient<Database>, packageId: string) {
  const { data } = await supabase.from("packages").select("customer_id, tracking_number").eq("id", packageId).single();
  return { customerId: data?.customer_id, trackingNumber: data?.tracking_number ?? "your package" };
}

// ============================================================
// Customer-facing actions
// ============================================================

const submitInvoiceSchema = z.object({
  packageId: z.string().uuid(),
  files: z.array(uploadedFileSchema).min(1),
  merchant: z.string().optional(),
  value: z.number().optional(),
  currency: z.string().optional(),
});

/** One invoice per package: re-submitting (fresh or after rejection) replaces
 *  the files and resets status to 'pending' — the unique constraint on
 *  invoices.package_id means this is always an upsert, never a second row. */
export async function submitInvoice(input: z.infer<typeof submitInvoiceSchema>): Promise<ActionResult> {
  const parsed = submitInvoiceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid invoice details." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const limit = await checkRateLimit("submit-invoice", user.id, { requests: 20, window: "1 m" });
  if (!limit.success) return { success: false, error: limit.error };

  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("package_id", parsed.data.packageId)
    .maybeSingle();

  let invoiceId: string;
  if (existing) {
    await deleteInvoiceFilesForInvoice(supabase, existing.id);
    const { error } = await supabase
      .from("invoices")
      .update({
        merchant: parsed.data.merchant ?? null,
        value: parsed.data.value ?? null,
        currency: parsed.data.currency ?? null,
        status: "pending",
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        has_unreviewed_changes: false,
      })
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
    invoiceId = existing.id;
  } else {
    // customer_id is required by the generated Insert type, but the
    // invoices_before_insert trigger always overwrites it from the package —
    // this cast reflects that it's never actually read from the client.
    const insertPayload: Partial<TablesInsert<"invoices">> = {
      package_id: parsed.data.packageId,
      merchant: parsed.data.merchant ?? null,
      value: parsed.data.value ?? null,
      currency: parsed.data.currency ?? null,
    };
    const { data: created, error } = await supabase
      .from("invoices")
      .insert(insertPayload as TablesInsert<"invoices">)
      .select("id")
      .single();
    if (error) return { success: false, error: error.message };
    invoiceId = created.id;
  }

  const { error: filesError } = await supabase.from("invoice_files").insert(
    parsed.data.files.map((f) => ({
      invoice_id: invoiceId,
      name: f.name,
      size: f.size,
      mime_type: f.type,
      storage_path: f.storagePath,
    }))
  );
  if (filesError) return { success: false, error: filesError.message };

  const { customerId, trackingNumber } = await getPackageOwnerContext(supabase, parsed.data.packageId);
  if (customerId) {
    await notifyCustomer(supabase, {
      customerId,
      title: "Invoice submitted",
      body: `Your invoice for ${trackingNumber} has been submitted and is pending review.`,
    });
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard");
  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  return { success: true };
}

const addInvoiceFilesSchema = z.object({
  invoiceId: z.string().uuid(),
  files: z.array(uploadedFileSchema).min(1),
  merchant: z.string().optional(),
  value: z.number().optional(),
  currency: z.string().optional(),
});

/** Customer editing an already-submitted (still-pending) invoice — flags
 *  hasUnreviewedChanges rather than requiring a full resubmit. */
export async function addInvoiceFiles(input: z.infer<typeof addInvoiceFilesSchema>): Promise<ActionResult> {
  const parsed = addInvoiceFilesSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const limit = await checkRateLimit("submit-invoice", user.id, { requests: 20, window: "1 m" });
  if (!limit.success) return { success: false, error: limit.error };

  const updatePayload: TablesUpdate<"invoices"> = { has_unreviewed_changes: true };
  if (parsed.data.merchant !== undefined) updatePayload.merchant = parsed.data.merchant;
  if (parsed.data.value !== undefined) updatePayload.value = parsed.data.value;
  if (parsed.data.currency !== undefined) updatePayload.currency = parsed.data.currency;

  const { error } = await supabase.from("invoices").update(updatePayload).eq("id", parsed.data.invoiceId);
  if (error) return { success: false, error: error.message };

  const { error: filesError } = await supabase.from("invoice_files").insert(
    parsed.data.files.map((f) => ({
      invoice_id: parsed.data.invoiceId,
      name: f.name,
      size: f.size,
      mime_type: f.type,
      storage_path: f.storagePath,
    }))
  );
  if (filesError) return { success: false, error: filesError.message };

  const { customerId, trackingNumber } = await getInvoiceOwnerContext(supabase, parsed.data.invoiceId);
  if (customerId) {
    await notifyCustomer(supabase, {
      customerId,
      title: "Invoice updated",
      body: `You added ${parsed.data.files.length} file(s) to your invoice for ${trackingNumber}.`,
    });
  }

  revalidatePath("/dashboard/invoices");
  return { success: true };
}

const removeInvoiceFileSchema = z.object({
  invoiceId: z.string().uuid(),
  fileId: z.string().uuid(),
});

export async function removeInvoiceFile(input: z.infer<typeof removeInvoiceFileSchema>): Promise<ActionResult> {
  const parsed = removeInvoiceFileSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const supabase = await createClient();
  const { data: file } = await supabase
    .from("invoice_files")
    .select("storage_path")
    .eq("id", parsed.data.fileId)
    .single();
  if (!file) return { success: false, error: "File not found." };

  await supabase.storage.from("invoice-files").remove([file.storage_path]);
  const { error } = await supabase.from("invoice_files").delete().eq("id", parsed.data.fileId);
  if (error) return { success: false, error: error.message };

  await supabase.from("invoices").update({ has_unreviewed_changes: true }).eq("id", parsed.data.invoiceId);

  const { customerId, trackingNumber } = await getInvoiceOwnerContext(supabase, parsed.data.invoiceId);
  if (customerId) {
    await notifyCustomer(supabase, {
      customerId,
      title: "Invoice updated",
      body: `You removed a file from your invoice for ${trackingNumber}.`,
    });
  }

  revalidatePath("/dashboard/invoices");
  return { success: true };
}

const replaceFileSchema = z.object({
  invoiceId: z.string().uuid(),
  oldFileId: z.string().uuid(),
  newFile: uploadedFileSchema,
});

export async function replaceInvoiceFileInInvoice(input: z.infer<typeof replaceFileSchema>): Promise<ActionResult> {
  const parsed = replaceFileSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const limit = await checkRateLimit("submit-invoice", user.id, { requests: 20, window: "1 m" });
  if (!limit.success) return { success: false, error: limit.error };

  const { data: oldFile } = await supabase
    .from("invoice_files")
    .select("storage_path")
    .eq("id", parsed.data.oldFileId)
    .single();
  if (oldFile) await supabase.storage.from("invoice-files").remove([oldFile.storage_path]);
  await supabase.from("invoice_files").delete().eq("id", parsed.data.oldFileId);

  const { error } = await supabase.from("invoice_files").insert({
    invoice_id: parsed.data.invoiceId,
    name: parsed.data.newFile.name,
    size: parsed.data.newFile.size,
    mime_type: parsed.data.newFile.type,
    storage_path: parsed.data.newFile.storagePath,
  });
  if (error) return { success: false, error: error.message };

  await supabase.from("invoices").update({ has_unreviewed_changes: true }).eq("id", parsed.data.invoiceId);

  const { customerId, trackingNumber } = await getInvoiceOwnerContext(supabase, parsed.data.invoiceId);
  if (customerId) {
    await notifyCustomer(supabase, {
      customerId,
      title: "Invoice updated",
      body: `You replaced a file in your invoice for ${trackingNumber}.`,
    });
  }

  revalidatePath("/dashboard/invoices");
  return { success: true };
}

const withdrawSchema = z.object({ invoiceId: z.string().uuid() });
type WithdrawResult = { success: true; invoice: Invoice } | { success: false; error: string };

/** Deletes only the DB rows — the underlying Storage objects are left alone
 *  so a same-session "Undo" can fully restore without re-uploading anything.
 *  (Only ever called on a pending invoice — the UI hides this action once
 *  an invoice has been reviewed.) */
export async function withdrawInvoice(input: z.infer<typeof withdrawSchema>): Promise<WithdrawResult> {
  const parsed = withdrawSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const supabase = await createClient();
  const { data: invoiceRow, error: fetchError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", parsed.data.invoiceId)
    .single();
  if (fetchError || !invoiceRow) return { success: false, error: "Invoice not found." };

  const { data: fileRows } = await supabase
    .from("invoice_files")
    .select("*")
    .eq("invoice_id", parsed.data.invoiceId);

  const { trackingNumber } = await getPackageOwnerContext(supabase, invoiceRow.package_id);

  const { error: deleteError } = await supabase.from("invoices").delete().eq("id", parsed.data.invoiceId);
  if (deleteError) return { success: false, error: deleteError.message };

  await notifyCustomer(supabase, {
    customerId: invoiceRow.customer_id,
    title: "Invoice withdrawn",
    body: `You withdrew your invoice submission for ${trackingNumber}. Upload a new one when you're ready.`,
  });

  revalidatePath("/dashboard/invoices");
  revalidatePath("/admin/invoices");

  return {
    success: true,
    invoice: {
      id: invoiceRow.id,
      packageId: invoiceRow.package_id,
      accountCode: "",
      files: (fileRows ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.mime_type,
        storagePath: f.storage_path,
        uploadedAt: f.uploaded_at,
      })),
      merchant: invoiceRow.merchant ?? undefined,
      value: invoiceRow.value ?? undefined,
      currency: invoiceRow.currency ?? undefined,
      status: invoiceRow.status as InvoiceStatus,
      submittedAt: invoiceRow.submitted_at,
      hasUnreviewedChanges: invoiceRow.has_unreviewed_changes,
      statusHistory: [],
    },
  };
}

const restoreSchema = z.object({
  invoice: z.object({
    id: z.string().uuid(),
    packageId: z.string().uuid(),
    files: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        size: z.number(),
        type: z.string(),
        storagePath: z.string().optional(),
      })
    ),
    merchant: z.string().optional(),
    value: z.number().optional(),
    currency: z.string().optional(),
    hasUnreviewedChanges: z.boolean().optional(),
  }),
});

/** Undo for withdrawInvoice — re-inserts the exact removed invoice + file
 *  rows (the Storage objects were never deleted). The insert trigger forces
 *  a non-admin's row to the "fresh, awaiting review" shape regardless of
 *  what's passed here, so this can't be used to sneak in a fake decision. */
export async function restoreInvoice(input: z.infer<typeof restoreSchema>): Promise<ActionResult> {
  const parsed = restoreSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };
  const inv = parsed.data.invoice;

  const supabase = await createClient();
  const restorePayload: Partial<TablesInsert<"invoices">> = {
    id: inv.id,
    package_id: inv.packageId,
    merchant: inv.merchant ?? null,
    value: inv.value ?? null,
    currency: inv.currency ?? null,
    has_unreviewed_changes: inv.hasUnreviewedChanges ?? false,
  };
  const { error } = await supabase.from("invoices").insert(restorePayload as TablesInsert<"invoices">);
  if (error) return { success: false, error: error.message };

  const filesToRestore = inv.files.filter((f) => f.storagePath);
  if (filesToRestore.length > 0) {
    await supabase.from("invoice_files").insert(
      filesToRestore.map((f) => ({
        id: f.id,
        invoice_id: inv.id,
        name: f.name,
        size: f.size,
        mime_type: f.type,
        storage_path: f.storagePath!,
      }))
    );
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath("/admin/invoices");
  return { success: true };
}

// ============================================================
// Admin-facing actions
// ============================================================

const reviewSchema = z.object({
  invoiceId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().optional(),
});

export async function reviewInvoice(input: z.infer<typeof reviewSchema>): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid review." };

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { success: false, error: "Admin access required." };

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("customer_id, packages(tracking_number)")
    .eq("id", parsed.data.invoiceId)
    .single();
  if (fetchError || !invoice) return { success: false, error: "Invoice not found." };

  const { error } = await supabase
    .from("invoices")
    .update({
      status: parsed.data.decision,
      rejection_reason: parsed.data.decision === "rejected" ? (parsed.data.rejectionReason ?? null) : null,
      has_unreviewed_changes: false,
    })
    .eq("id", parsed.data.invoiceId);
  if (error) return { success: false, error: error.message };

  const tracking = invoice.packages?.tracking_number ?? "your package";
  await notifyCustomer(supabase, {
    customerId: invoice.customer_id,
    title: parsed.data.decision === "approved" ? "Invoice approved" : "Invoice rejected",
    body:
      parsed.data.decision === "approved"
        ? `Your invoice for ${tracking} has been approved.`
        : `Your invoice for ${tracking} was rejected: ${parsed.data.rejectionReason ?? ""}`,
  });

  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard");
  return { success: true };
}
