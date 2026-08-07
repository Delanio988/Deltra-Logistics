"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/actions/auth-helpers";
import { buildShippingLineItem, type BillStatus } from "@/lib/billing";
import { formatCurrency } from "@/lib/quote-config";
import { notifyCustomer } from "@/lib/notify";
import { sendPackageReceivedEmail, sendPackageReadyEmail } from "@/lib/email-templates";
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

  const { supabase, user, isAdmin } = await requireAdmin();
  if (!isAdmin || !user) return { success: false, error: "Admin access required." };

  const { data: customer, error: customerError } = await supabase
    .from("profiles")
    .select("id, email, first_name")
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
    created_by: user.id,
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

  // Branded HTML email, additional to the in-app/plain-text notifyCustomer
  // calls above — best-effort, never blocks the package add from succeeding.
  if (parsed.data.status === "Received at Warehouse" && customer.email) {
    const emailResult = await sendPackageReceivedEmail({
      to: customer.email,
      firstName: customer.first_name ?? "",
      trackingNumber: parsed.data.trackingNumber,
      merchant: parsed.data.merchant,
      description: parsed.data.description,
      weightLb: parsed.data.weightLb,
      dateReceived: parsed.data.dateReceived,
      invoiceRequired: parsed.data.invoiceRequired,
    });
    console.info(
      `[addPackage] Package-received email for ${parsed.data.trackingNumber}: ${emailResult.success ? "sent" : `not sent (${emailResult.error})`}`
    );
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

  const { supabase, user, isAdmin } = await requireAdmin();
  if (!isAdmin || !user) return { success: false, error: "Admin access required." };

  const { data: pkg, error: fetchError } = await supabase
    .from("packages")
    .select(
      "id, customer_id, tracking_number, merchant, description, weight_lb, date_received, status, invoice_required, profiles!packages_customer_id_fkey(email, first_name)"
    )
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

  const customerEmail = pkg.profiles?.email;
  const customerFirstName = pkg.profiles?.first_name ?? "";

  // Branded HTML email, additional to the plain-text notifyCustomer call
  // above — best-effort, never blocks the status update from succeeding.
  if (parsed.data.status === "Received at Warehouse" && customerEmail) {
    const emailResult = await sendPackageReceivedEmail({
      to: customerEmail,
      firstName: customerFirstName,
      trackingNumber: pkg.tracking_number,
      merchant: pkg.merchant,
      description: pkg.description,
      weightLb: pkg.weight_lb,
      dateReceived: pkg.date_received,
      invoiceRequired: pkg.invoice_required,
    });
    console.info(
      `[updatePackageStatus] Package-received email for ${pkg.tracking_number}: ${emailResult.success ? "sent" : `not sent (${emailResult.error})`}`
    );
  }

  // First time this package reaches Ready for Pickup, auto-create its bill
  // (base shipping charge) — bills.total is trigger-recomputed from
  // line_items, so inserting the line item is what actually sets the total.
  if (parsed.data.status === "Ready for Pickup") {
    const { data: existingBill } = await supabase.from("bills").select("id").eq("package_id", pkg.id).maybeSingle();
    let billId = existingBill?.id;

    if (!billId) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const { data: bill, error: billError } = await supabase
        .from("bills")
        .insert({
          customer_id: pkg.customer_id,
          package_id: pkg.id,
          due_date: dueDate.toISOString().slice(0, 10),
          created_by: user.id,
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
        billId = bill.id;
      }
    }

    // Branded invoice-style email — always re-reads the bill/line_items
    // fresh right before sending (never recalculates pricing itself), so it
    // reflects the real total whether the bill was just created above or
    // already existed with admin-added charges (duty, handling, etc.).
    if (billId && customerEmail) {
      const [{ data: freshBill }, { data: lineItemRows }] = await Promise.all([
        supabase.from("bills").select("total, amount_paid, status, due_date").eq("id", billId).single(),
        supabase.from("line_items").select("label, amount").eq("bill_id", billId).order("created_at", { ascending: true }),
      ]);

      if (freshBill) {
        const emailResult = await sendPackageReadyEmail({
          to: customerEmail,
          firstName: customerFirstName,
          trackingNumber: pkg.tracking_number,
          merchant: pkg.merchant,
          description: pkg.description,
          weightLb: pkg.weight_lb,
          lineItems: (lineItemRows ?? []).map((li) => ({ label: li.label, amount: li.amount })),
          total: freshBill.total,
          amountPaid: freshBill.amount_paid,
          status: freshBill.status as BillStatus,
          dueDate: freshBill.due_date ?? "",
        });
        console.info(
          `[updatePackageStatus] Package-ready email for ${pkg.tracking_number}: ${emailResult.success ? "sent" : `not sent (${emailResult.error})`}`
        );
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
