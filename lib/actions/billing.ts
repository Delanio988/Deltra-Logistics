"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/actions/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyCustomer } from "@/lib/notify";
import { buildFygaroCheckoutUrl, buildWalletTopupReference, isFygaroConfigured } from "@/lib/payments/fygaro";
import type { Tables, TablesInsert } from "@/lib/database.types";
import type { Transaction, TransactionType } from "@/lib/billing";

type ActionResult = { success: true } | { success: false; error: string };
type PayBillsResult =
  | { success: true; shortfall: number; transaction?: Transaction }
  | { success: false; error: string };
type CheckoutResult = { success: true; checkoutUrl: string } | { success: false; error: string };

function formatDbDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function mapTransactionRow(row: Tables<"transactions">): Transaction {
  return {
    id: row.id,
    accountCode: "",
    amount: row.amount,
    type: row.type as TransactionType,
    description: row.description,
    reference: row.reference ?? undefined,
    createdAt: formatDbDate(row.created_at),
    balanceAfter: row.balance_after,
  };
}

// ============================================================
// Customer-facing actions
// ============================================================

const payBillsSchema = z.object({ billIds: z.array(z.string().uuid()).min(1) });

/** Single bill: pay_bill_from_wallet allows a partial payment. Multiple:
 *  pay_bills_from_wallet requires full coverage of all selected bills. Both
 *  RPCs do the actual locking/balance math server-side in Postgres. */
export async function payBillsFromWallet(input: z.infer<typeof payBillsSchema>): Promise<PayBillsResult> {
  const parsed = payBillsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const limit = await checkRateLimit("pay-bills", user.id, { requests: 10, window: "1 m" });
  if (!limit.success) return { success: false, error: limit.error };

  if (parsed.data.billIds.length === 1) {
    const billId = parsed.data.billIds[0];
    const { data: txnRow, error } = await supabase.rpc("pay_bill_from_wallet", { p_bill_id: billId });
    if (error) return { success: false, error: error.message };

    const { data: bill } = await supabase.from("bills").select("total, amount_paid").eq("id", billId).single();
    const shortfall = bill ? Math.max(0, bill.total - bill.amount_paid) : 0;

    revalidatePath("/dashboard/billing");
    revalidatePath("/admin/billing");
    revalidatePath("/dashboard");
    return { success: true, shortfall, transaction: txnRow ? mapTransactionRow(txnRow) : undefined };
  }

  const { data: txnRows, error } = await supabase.rpc("pay_bills_from_wallet", { p_bill_ids: parsed.data.billIds });
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/billing");
  revalidatePath("/admin/billing");
  revalidatePath("/dashboard");
  return { success: true, shortfall: 0, transaction: txnRows?.[0] ? mapTransactionRow(txnRows[0]) : undefined };
}

const markPendingSchema = z.object({ billIds: z.array(z.string().uuid()).min(1) });

export async function markBillsPendingBranch(input: z.infer<typeof markPendingSchema>): Promise<ActionResult> {
  const parsed = markPendingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const supabase = await createClient();
  const { error } =
    parsed.data.billIds.length === 1
      ? await supabase.rpc("mark_bill_pending_branch", { p_bill_id: parsed.data.billIds[0] })
      : await supabase.rpc("mark_bills_pending_branch", { p_bill_ids: parsed.data.billIds });
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/billing");
  revalidatePath("/admin/billing");
  return { success: true };
}

const startBillCheckoutSchema = z.object({ billId: z.string().uuid() });

/** Redirects the customer to Fygaro's hosted checkout for a single bill —
 *  the webhook (app/api/webhooks/fygaro/route.ts) confirms the payment
 *  server-side once Fygaro reports success; this action never marks
 *  anything paid itself. */
export async function startHostedBillPayment(input: z.infer<typeof startBillCheckoutSchema>): Promise<CheckoutResult> {
  if (!isFygaroConfigured()) return { success: false, error: "Card/bank payments aren't available yet." };

  const parsed = startBillCheckoutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const limit = await checkRateLimit("start-hosted-payment", user.id, { requests: 10, window: "1 m" });
  if (!limit.success) return { success: false, error: limit.error };

  // RLS already scopes this select to the caller's own bills.
  const { data: bill, error } = await supabase
    .from("bills")
    .select("id, customer_id, total, amount_paid, status")
    .eq("id", parsed.data.billId)
    .single();
  if (error || !bill) return { success: false, error: "Bill not found." };
  if (bill.status === "paid") return { success: false, error: "This bill is already paid." };

  const due = Math.max(0, bill.total - bill.amount_paid);
  const checkoutUrl = buildFygaroCheckoutUrl({ amount: due, reference: bill.id, note: "Bill payment" });
  if (!checkoutUrl) return { success: false, error: "Card/bank payments aren't available yet." };

  return { success: true, checkoutUrl };
}

const startTopupCheckoutSchema = z.object({ amount: z.number().positive() });

/** Redirects the customer to Fygaro's hosted checkout for a wallet top-up. */
export async function startHostedWalletTopup(input: z.infer<typeof startTopupCheckoutSchema>): Promise<CheckoutResult> {
  if (!isFygaroConfigured()) return { success: false, error: "Card/bank payments aren't available yet." };

  const parsed = startTopupCheckoutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const limit = await checkRateLimit("start-hosted-payment", user.id, { requests: 10, window: "1 m" });
  if (!limit.success) return { success: false, error: limit.error };

  const checkoutUrl = buildFygaroCheckoutUrl({
    amount: parsed.data.amount,
    reference: buildWalletTopupReference(user.id),
    note: "Wallet top-up",
  });
  if (!checkoutUrl) return { success: false, error: "Card/bank payments aren't available yet." };

  return { success: true, checkoutUrl };
}

// ============================================================
// Admin-facing actions
// ============================================================

const addLineItemSchema = z.object({
  billId: z.string().uuid(),
  label: z.string().min(1),
  amount: z.number().positive(),
});

/** bills.total is trigger-recomputed from line_items — no direct bill write needed. */
export async function addLineItemToBill(input: z.infer<typeof addLineItemSchema>): Promise<ActionResult> {
  const parsed = addLineItemSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const { supabase, user, isAdmin } = await requireAdmin();
  if (!isAdmin || !user) return { success: false, error: "Admin access required." };

  const limit = await checkRateLimit("add-line-item", user.id, { requests: 20, window: "1 m" });
  if (!limit.success) return { success: false, error: limit.error };

  const payload: TablesInsert<"line_items"> = {
    bill_id: parsed.data.billId,
    label: parsed.data.label,
    amount: parsed.data.amount,
    created_by: user.id,
  };
  const { error } = await supabase.from("line_items").insert(payload);
  if (error) return { success: false, error: error.message };

  const { data: bill } = await supabase.from("bills").select("customer_id").eq("id", parsed.data.billId).single();
  if (bill) {
    await notifyCustomer(supabase, {
      customerId: bill.customer_id,
      title: "New charge added",
      body: `${parsed.data.label} was added to your bill.`,
    });
  }

  revalidatePath("/admin/billing");
  revalidatePath("/dashboard/billing");
  return { success: true };
}

const markPaidByAdminSchema = z.object({ billId: z.string().uuid() });

export async function markBillPaidByAdmin(input: z.infer<typeof markPaidByAdminSchema>): Promise<ActionResult> {
  const parsed = markPaidByAdminSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const { supabase, user, isAdmin } = await requireAdmin();
  if (!isAdmin || !user) return { success: false, error: "Admin access required." };

  const limit = await checkRateLimit("confirm-bill-payment", user.id, { requests: 20, window: "1 m" });
  if (!limit.success) return { success: false, error: limit.error };

  const { data: txnRow, error } = await supabase.rpc("admin_confirm_bill_payment", { p_bill_id: parsed.data.billId });
  if (error) return { success: false, error: error.message };

  if (txnRow) {
    await notifyCustomer(supabase, {
      customerId: txnRow.customer_id,
      title: "Payment confirmed",
      body: "Your payment was confirmed as paid in cash at the branch.",
    });
  }

  revalidatePath("/admin/billing");
  revalidatePath("/dashboard/billing");
  return { success: true };
}

const walletAdjustSchema = z.object({
  accountCode: z.string().min(1),
  amount: z.number().positive(),
  note: z.string().optional(),
});

async function adjustWallet(
  input: z.infer<typeof walletAdjustSchema>,
  type: "topup" | "refund",
  defaultDescription: string
): Promise<ActionResult> {
  const parsed = walletAdjustSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const { supabase, user, isAdmin } = await requireAdmin();
  if (!isAdmin || !user) return { success: false, error: "Admin access required." };

  const limit = await checkRateLimit("adjust-wallet", user.id, { requests: 20, window: "1 m" });
  if (!limit.success) return { success: false, error: limit.error };

  const { data: customer, error: customerError } = await supabase
    .from("profiles")
    .select("id")
    .eq("account_code", parsed.data.accountCode)
    .single();
  if (customerError || !customer) return { success: false, error: "Customer not found." };

  const description = parsed.data.note?.trim() ? `${defaultDescription} — ${parsed.data.note.trim()}` : defaultDescription;

  const { data: txnRow, error } = await supabase.rpc("admin_adjust_wallet", {
    p_customer_id: customer.id,
    p_amount: parsed.data.amount,
    p_type: type,
    p_description: description,
  });
  if (error) return { success: false, error: error.message };

  if (txnRow) {
    await notifyCustomer(supabase, {
      customerId: customer.id,
      title: type === "topup" ? "Wallet credited" : "Refund issued",
      body: description,
    });
  }

  revalidatePath("/admin/billing");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function creditWallet(input: z.infer<typeof walletAdjustSchema>): Promise<ActionResult> {
  return adjustWallet(input, "topup", "Wallet top-up");
}

export async function issueRefund(input: z.infer<typeof walletAdjustSchema>): Promise<ActionResult> {
  return adjustWallet(input, "refund", "Refund");
}
