"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/actions/auth-helpers";
import { buildShippingLineItem } from "@/lib/billing";
import { formatCurrency } from "@/lib/quote-config";
import { notifyCustomer } from "@/lib/notify";
import type { TablesInsert } from "@/lib/database.types";

const PACKAGE_STATUS_VALUES = [
  "Pre-Alerted",
  "Received at Warehouse",
  "In Transit",
  "Arrived at Local Branch",
  "Ready for Pickup",
  "Delivered",
] as const;

type ActionResult = { success: true } | { success: false; error: string };

const addPackageSchema = z.object({
  accountCode: z.string().min(1),
  trackingNumber: z.string().min(1),
  merchant: z.string().min(1),
  description: z.string().min(1),
  weightLb: z.number().positive(),
  dateReceived: z.string().min(1),
  status: z.enum(PACKAGE_STATUS_VALUES),
  invoiceRequired: z.boolean(),
});

export async function addPackage(input: z.infer<typeof addPackageSchema>): Promise<ActionResult> {
  const parsed = addPackageSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid package details." };

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { success: false, error: "Admin access required." };

  const { data: customer, error: customerError } = await supabase
    .from("profiles")
    .select("id")
    .eq("account_code", parsed.data.accountCode)
    .single();
  if (customerError || !customer) return { success: false, error: "Customer not found." };

  const insertPayload: TablesInsert<"packages"> = {
    customer_id: customer.id,
    tracking_number: parsed.data.trackingNumber,
    merchant: parsed.data.merchant,
    description: parsed.data.description,
    weight_lb: parsed.data.weightLb,
    date_received: parsed.data.dateReceived,
    status: parsed.data.status,
    invoice_required: parsed.data.invoiceRequired,
  };

  const { error } = await supabase.from("packages").insert(insertPayload);
  if (error) return { success: false, error: error.message };

  await notifyCustomer(supabase, {
    customerId: customer.id,
    title: "New package added",
    body: `${parsed.data.trackingNumber} (${parsed.data.merchant}) has been added to your account.`,
  });
  if (parsed.data.invoiceRequired) {
    await notifyCustomer(supabase, {
      customerId: customer.id,
      title: "Invoice required",
      body: `${parsed.data.trackingNumber} needs a purchase invoice before it can be cleared. Upload it from your dashboard.`,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true };
}

const updateStatusSchema = z.object({
  packageId: z.string().uuid(),
  status: z.enum(PACKAGE_STATUS_VALUES),
});

export async function updatePackageStatus(input: z.infer<typeof updateStatusSchema>): Promise<ActionResult> {
  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid status update." };

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { success: false, error: "Admin access required." };

  const { data: pkg, error: fetchError } = await supabase
    .from("packages")
    .select("id, customer_id, tracking_number, weight_lb, status")
    .eq("id", parsed.data.packageId)
    .single();
  if (fetchError || !pkg) return { success: false, error: "Package not found." };
  if (pkg.status === parsed.data.status) return { success: true };

  const { error } = await supabase.from("packages").update({ status: parsed.data.status }).eq("id", pkg.id);
  if (error) return { success: false, error: error.message };

  await notifyCustomer(supabase, {
    customerId: pkg.customer_id,
    title: "Package status updated",
    body: `${pkg.tracking_number} is now ${parsed.data.status}.`,
  });

  // First time this package reaches Ready for Pickup, auto-create its bill
  // (base shipping charge) — bills.total is trigger-recomputed from
  // line_items, so inserting the line item is what actually sets the total.
  if (parsed.data.status === "Ready for Pickup") {
    const { data: existingBill } = await supabase.from("bills").select("id").eq("package_id", pkg.id).maybeSingle();
    if (!existingBill) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const { data: bill, error: billError } = await supabase
        .from("bills")
        .insert({
          customer_id: pkg.customer_id,
          package_id: pkg.id,
          due_date: dueDate.toISOString().slice(0, 10),
        })
        .select("id")
        .single();

      if (!billError && bill) {
        const lineItem = buildShippingLineItem(pkg.weight_lb);
        await supabase.from("line_items").insert({ bill_id: bill.id, label: lineItem.label, amount: lineItem.amount });
        await notifyCustomer(supabase, {
          customerId: pkg.customer_id,
          title: "Bill ready",
          body: `A bill of ${formatCurrency(lineItem.amount)} is ready for ${pkg.tracking_number} — view it under Bills/Transactions.`,
        });
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true };
}

const setInvoiceRequiredSchema = z.object({
  packageId: z.string().uuid(),
  required: z.boolean(),
});

export async function setPackageInvoiceRequired(input: z.infer<typeof setInvoiceRequiredSchema>): Promise<ActionResult> {
  const parsed = setInvoiceRequiredSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { success: false, error: "Admin access required." };

  const { data: pkg, error: fetchError } = await supabase
    .from("packages")
    .select("id, customer_id, tracking_number, invoice_required")
    .eq("id", parsed.data.packageId)
    .single();
  if (fetchError || !pkg) return { success: false, error: "Package not found." };
  if (pkg.invoice_required === parsed.data.required) return { success: true };

  const { error } = await supabase.from("packages").update({ invoice_required: parsed.data.required }).eq("id", pkg.id);
  if (error) return { success: false, error: error.message };

  if (parsed.data.required) {
    await notifyCustomer(supabase, {
      customerId: pkg.customer_id,
      title: "Invoice required",
      body: `${pkg.tracking_number} needs a purchase invoice before it can be cleared. Upload it from your dashboard.`,
    });
  }

  revalidatePath("/admin");
  return { success: true };
}
