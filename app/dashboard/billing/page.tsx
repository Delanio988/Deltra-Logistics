"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import RequireAuth from "@/components/auth/RequireAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WalletCard from "@/components/dashboard/WalletCard";
import OutstandingBills from "@/components/dashboard/OutstandingBills";
import TransactionHistoryTable from "@/components/dashboard/TransactionHistoryTable";
import PaymentDialog from "@/components/dashboard/PaymentDialog";
import ReceiptModal from "@/components/dashboard/ReceiptModal";
import Toast from "@/components/ui/Toast";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useAuth } from "@/lib/auth-context";
import { useDataStore } from "@/lib/data-store";
import { getOutstandingBills, sumBalanceDue, type Transaction } from "@/lib/billing";
import { formatCurrency } from "@/lib/quote-config";

type PaymentTarget = { kind: "bill"; billIds: string[] } | { kind: "topup" };
type ToastState = { message: string; action?: { label: string; onClick: () => void } };

const DEFAULT_TOPUP_AMOUNT = 2000;

function BillingContent() {
  const { user } = useAuth();
  const { getPackagesForAccount, bills, getTransactionsForAccount, getWalletBalance, payBillsFromWallet, markBillsPendingBranch } =
    useDataStore();

  const accountCode = user?.accountCode ?? "";
  const packages = getPackagesForAccount(accountCode);
  const outstanding = getOutstandingBills(bills, accountCode);
  const transactions = getTransactionsForAccount(accountCode);
  const walletBalance = getWalletBalance(accountCode);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null);
  const [receiptTxn, setReceiptTxn] = useState<Transaction | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, action?: ToastState["action"]) => setToast({ message, action });

  const toggleSelect = (billId: string) => {
    setSelectedIds((prev) => (prev.includes(billId) ? prev.filter((id) => id !== billId) : [...prev, billId]));
  };

  const openPayBills = (billIds: string[]) => setPaymentTarget({ kind: "bill", billIds });
  const openTopUp = () => setPaymentTarget({ kind: "topup" });
  const closePaymentDialog = () => setPaymentTarget(null);

  const handleConfirmWallet = () => {
    if (!paymentTarget || paymentTarget.kind !== "bill") return;
    const { billIds } = paymentTarget;
    const result = payBillsFromWallet(billIds);

    if (!result.success) {
      showToast(result.error ?? "Payment failed.");
    } else {
      const receiptAction = result.transaction
        ? { label: "View Receipt", onClick: () => setReceiptTxn(result.transaction!) }
        : undefined;
      if (result.shortfall && result.shortfall > 0) {
        showToast(`Partial payment applied — ${formatCurrency(result.shortfall)} still due.`, receiptAction);
      } else {
        showToast("Payment successful.", receiptAction);
      }
    }
    setSelectedIds((prev) => prev.filter((id) => !billIds.includes(id)));
  };

  const handleConfirmCash = (amount: number) => {
    if (!paymentTarget) return;
    if (paymentTarget.kind === "bill") {
      const { billIds } = paymentTarget;
      markBillsPendingBranch(billIds);
      showToast("Marked as pending — pay at the branch.");
      setSelectedIds((prev) => prev.filter((id) => !billIds.includes(id)));
    } else {
      showToast(`Visit any branch to pay ${formatCurrency(amount)} — we'll credit your wallet once payment is confirmed.`);
    }
  };

  const dialogBills = paymentTarget?.kind === "bill" ? bills.filter((b) => paymentTarget.billIds.includes(b.id)) : [];
  const dialogAmount = paymentTarget?.kind === "bill" ? sumBalanceDue(dialogBills) : DEFAULT_TOPUP_AMOUNT;
  const dialogTitle =
    paymentTarget?.kind === "bill" ? `Pay ${dialogBills.length} bill${dialogBills.length === 1 ? "" : "s"}` : "Top up your wallet";
  const dialogDescription =
    paymentTarget?.kind === "bill"
      ? dialogBills
          .map((b) => packages.find((p) => p.id === b.packageId)?.trackingNumber)
          .filter(Boolean)
          .join(", ")
      : "We'll credit your wallet once the payment is confirmed.";

  return (
    <div className="min-h-screen bg-bg">
      <DashboardHeader />

      <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
        <ScrollReveal direction="none">
          <Link href="/dashboard" className="text-sm font-medium text-fg/60 transition-colors hover:text-accent">
            ← Back to dashboard
          </Link>
          <h1 className="mt-4 text-display-sm font-extrabold text-fg">Bills &amp; Transactions</h1>
          <p className="mt-2 text-fg/60">Pay outstanding bills, top up your wallet, and review your payment history.</p>
        </ScrollReveal>

        <ScrollReveal index={0} className="mt-10">
          <WalletCard balance={walletBalance} onTopUp={openTopUp} />
        </ScrollReveal>

        <ScrollReveal index={1} className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-fg/50">Outstanding Bills</h2>
          <div className="mt-4">
            <OutstandingBills
              bills={outstanding}
              packages={packages}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onPayNow={openPayBills}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal index={2} className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-fg/50">Transaction History</h2>
          <div className="mt-4">
            <TransactionHistoryTable transactions={transactions} onViewReceipt={setReceiptTxn} />
          </div>
        </ScrollReveal>
      </main>

      <AnimatePresence>
        {paymentTarget && (
          <PaymentDialog
            title={dialogTitle}
            description={dialogDescription}
            amount={dialogAmount}
            walletBalance={walletBalance}
            allowWallet={paymentTarget.kind === "bill"}
            allowPartial={paymentTarget.kind === "bill" && dialogBills.length === 1}
            editableAmount={paymentTarget.kind === "topup"}
            onClose={closePaymentDialog}
            onConfirmWallet={handleConfirmWallet}
            onConfirmCash={handleConfirmCash}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {receiptTxn && (
          <ReceiptModal transaction={receiptTxn} customerName={user?.name ?? "Customer"} onClose={() => setReceiptTxn(null)} />
        )}
      </AnimatePresence>

      <Toast message={toast?.message ?? null} action={toast?.action} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default function BillingPage() {
  return (
    <RequireAuth role="customer">
      <BillingContent />
    </RequireAuth>
  );
}
