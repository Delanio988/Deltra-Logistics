// Billing types, seed data, and pure helpers. Live/mutable bill + transaction
// state lives in lib/data-store.tsx (seeded from INITIAL_BILLS/INITIAL_
// TRANSACTIONS below) — this file only holds shape/types/seed content, same
// split as lib/invoices.ts.

import { CURRENCY, RATE_PER_LB, calculateShippingCost } from "@/lib/quote-config";

export type LineItem = { label: string; amount: number };

export type BillStatus = "unpaid" | "partially_paid" | "paid" | "pending_branch";

export type Bill = {
  id: string;
  accountCode: string;
  /** Matches Package.id — one bill per package. */
  packageId: string;
  lineItems: LineItem[];
  total: number;
  amountPaid: number;
  status: BillStatus;
  dueDate: string;
  paidAt?: string;
};

export type PaymentMethod = "wallet" | "card" | "bank" | "cash";

export type TransactionType = "payment" | "topup" | "refund" | "charge";

export type Transaction = {
  id: string;
  accountCode: string;
  /** Positive = credit to the wallet, negative = debit. */
  amount: number;
  type: TransactionType;
  description: string;
  reference?: string;
  createdAt: string;
  /** Wallet balance immediately after this transaction. Charges and
   *  cash-collected payments don't move the wallet, so balanceAfter carries
   *  forward unchanged for those — see getWalletBalance below. */
  balanceAfter: number;
};

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  pending_branch: "Pending — Pay at Branch",
};

export function billBalanceDue(bill: Bill): number {
  return Math.max(0, bill.total - bill.amountPaid);
}

export function computeBillTotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.amount, 0);
}

export function getBillsForAccount(bills: Bill[], accountCode: string): Bill[] {
  return bills.filter((b) => b.accountCode === accountCode);
}

export function getOutstandingBills(bills: Bill[], accountCode: string): Bill[] {
  return bills.filter((b) => b.accountCode === accountCode && b.status !== "paid");
}

export function sumBalanceDue(bills: Bill[]): number {
  return bills.reduce((sum, b) => sum + billBalanceDue(b), 0);
}

export function getTransactionsForAccount(transactions: Transaction[], accountCode: string): Transaction[] {
  return transactions.filter((t) => t.accountCode === accountCode);
}

/**
 * The wallet balance is derived, not stored — it's whatever `balanceAfter`
 * the account's most recent transaction (oldest-first order) left behind, or
 * 0 if the account has never had one. Single source of truth: there's no
 * separate balance field that could drift from the ledger.
 */
export function getWalletBalance(transactions: Transaction[], accountCode: string): number {
  const accountTx = getTransactionsForAccount(transactions, accountCode);
  if (accountTx.length === 0) return 0;
  return accountTx[accountTx.length - 1].balanceAfter;
}

export function buildShippingLineItem(weightLb: number): LineItem {
  return { label: `Shipping (${weightLb} lb × ${CURRENCY}${RATE_PER_LB}/lb)`, amount: calculateShippingCost(weightLb) };
}

// ---- Payment-processor seam. Wallet payments and cash-at-branch are fully
// functional in this demo; card and bank transfer are NOT implemented here —
// raw card/bank details must never be collected client-side (PCI-DSS). A real
// integration redirects to (or embeds) a hosted checkout page and confirms
// payment via a server-side webhook, never handling card numbers in this
// codebase. ----
// TODO: integrate a hosted payment processor (Stripe Checkout, Fygaro, WiPay,
// or a local Jamaican gateway) — redirect/embed only.
export function initiateHostedPayment(method: Extract<PaymentMethod, "card" | "bank">): { status: "unavailable"; method: PaymentMethod } {
  return { status: "unavailable", method };
}

// Seed data: Alex Morgan (DLT1789-A) has two outstanding bills sized so
// paying bill-1 from the wallet succeeds outright, and paying bill-2 (or both
// together) demonstrates the wallet-shortfall path without manual setup.
export const INITIAL_BILLS: Bill[] = [
  {
    id: "bill-1",
    accountCode: "DLT1789-A",
    packageId: "pkg-3",
    lineItems: [
      { label: "Shipping (3 lb × J$600/lb)", amount: 1800 },
      { label: "Customs Duty", amount: 450 },
      { label: "Handling Fee", amount: 250 },
    ],
    total: 2500,
    amountPaid: 0,
    status: "unpaid",
    dueDate: "Jul 20, 2026",
  },
  {
    id: "bill-2",
    accountCode: "DLT1789-A",
    packageId: "pkg-4",
    lineItems: [
      { label: "Shipping (22 lb × J$600/lb)", amount: 13200 },
      { label: "Customs Duty", amount: 1800 },
      { label: "Delivery Fee", amount: 900 },
    ],
    total: 15900,
    amountPaid: 0,
    status: "unpaid",
    dueDate: "Jul 15, 2026",
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "txn-1",
    accountCode: "DLT1789-A",
    type: "topup",
    amount: 5000,
    description: "Wallet top-up — cash at branch",
    reference: "Montego Bay — Fairview",
    createdAt: "Jun 15, 2026",
    balanceAfter: 5000,
  },
  {
    id: "txn-2",
    accountCode: "DLT1789-A",
    type: "payment",
    amount: -1800,
    description: "Payment — prior shipment",
    reference: "DL55512340",
    createdAt: "Jun 25, 2026",
    balanceAfter: 3200,
  },
];
