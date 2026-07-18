import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database, Tables } from "@/lib/database.types";
import type { Bill, BillStatus, LineItem, Transaction, TransactionType } from "@/lib/billing";

export type BillWithCustomer = Bill & { customerName: string };

function formatDbDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function mapLineItem(row: Tables<"line_items">): LineItem {
  return { label: row.label, amount: row.amount };
}

async function mapBillRow(supabase: SupabaseClient<Database>, row: Tables<"bills">, accountCode: string): Promise<Bill> {
  const { data: lineItems } = await supabase
    .from("line_items")
    .select("*")
    .eq("bill_id", row.id)
    .order("created_at", { ascending: true });

  return {
    id: row.id,
    accountCode,
    packageId: row.package_id,
    lineItems: (lineItems ?? []).map(mapLineItem),
    total: row.total,
    amountPaid: row.amount_paid,
    status: row.status as BillStatus,
    dueDate: row.due_date ? formatDbDate(row.due_date) : "",
    paidAt: row.paid_at ? formatDbDate(row.paid_at) : undefined,
  };
}

function mapTransactionRow(row: Tables<"transactions">, accountCode: string): Transaction {
  return {
    id: row.id,
    accountCode,
    amount: row.amount,
    type: row.type as TransactionType,
    description: row.description,
    reference: row.reference ?? undefined,
    createdAt: formatDbDate(row.created_at),
    balanceAfter: row.balance_after,
  };
}

async function getCurrentUserContext(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("account_code").eq("id", user.id).single();
  return { userId: user.id, accountCode: profile?.account_code ?? "" };
}

/** RLS scopes this to the caller's own bills — no explicit filter needed. */
export async function getBillsForCurrentUser(): Promise<Bill[]> {
  const supabase = await createClient();
  const ctx = await getCurrentUserContext(supabase);
  if (!ctx) return [];

  const { data, error } = await supabase.from("bills").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return Promise.all((data ?? []).map((row) => mapBillRow(supabase, row, ctx.accountCode)));
}

export async function getTransactionsForCurrentUser(): Promise<Transaction[]> {
  const supabase = await createClient();
  const ctx = await getCurrentUserContext(supabase);
  if (!ctx) return [];

  const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapTransactionRow(row, ctx.accountCode));
}

/** The wallet balance is a plain column on profiles, kept in sync by the
 *  wallet RPC functions and triggers — no client-side derivation needed. */
export async function getWalletBalanceForCurrentUser(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", user.id).single();
  return profile?.wallet_balance ?? 0;
}

/** Admin view — every bill, with the owning customer's name + account code. */
export async function getAllBillsWithCustomer(): Promise<BillWithCustomer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*, profiles(first_name, last_name, account_code)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return Promise.all(
    (data ?? []).map(async (row) => {
      const profile = row.profiles;
      const accountCode = profile?.account_code ?? "";
      const customerName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : accountCode;
      const bill = await mapBillRow(supabase, row, accountCode);
      return { ...bill, customerName };
    })
  );
}
