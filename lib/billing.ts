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
   *  forward unchanged for those. */
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

export function getOutstandingBills(bills: Bill[], accountCode: string): Bill[] {
  return bills.filter((b) => b.accountCode === accountCode && b.status !== "paid");
}

export function sumBalanceDue(bills: Bill[]): number {
  return bills.reduce((sum, b) => sum + billBalanceDue(b), 0);
}

export function buildShippingLineItem(weightLb: number): LineItem {
  return { label: `Shipping (${weightLb} lb × ${CURRENCY}${RATE_PER_LB}/lb)`, amount: calculateShippingCost(weightLb) };
}
