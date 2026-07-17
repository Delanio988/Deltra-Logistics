"use client";

import { useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminHeader from "@/components/admin/AdminHeader";
import BillingAdminRow from "@/components/admin/BillingAdminRow";
import WalletActionsForm from "@/components/admin/WalletActionsForm";
import Toast from "@/components/ui/Toast";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useDataStore } from "@/lib/data-store";
import { CUSTOMERS } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/quote-config";

function AdminBillingContent() {
  const { bills, packages, addLineItemToBill, markBillPaidByAdmin, creditWallet, issueRefund } = useDataStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const customerName = (accountCode: string) => CUSTOMERS.find((c) => c.accountCode === accountCode)?.name ?? accountCode;

  // Outstanding first, so what needs action surfaces at the top.
  const sorted = [...bills].sort((a, b) => (a.status === "paid" ? 1 : 0) - (b.status === "paid" ? 1 : 0));

  return (
    <div className="min-h-screen bg-bg">
      <AdminHeader />

      <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
        <ScrollReveal direction="none">
          <h1 className="text-display-sm font-extrabold text-fg">Billing</h1>
          <p className="mt-2 text-fg/60">Add charges, confirm branch payments, and manage customer wallets.</p>
        </ScrollReveal>

        <ScrollReveal index={0} className="mt-10">
          <WalletActionsForm
            onCredit={(accountCode, amount, note) => {
              creditWallet(accountCode, amount, note);
              setToastMessage(`Credited ${formatCurrency(amount)} to ${customerName(accountCode)}'s wallet.`);
            }}
            onRefund={(accountCode, amount, note) => {
              issueRefund(accountCode, amount, note);
              setToastMessage(`Refunded ${formatCurrency(amount)} to ${customerName(accountCode)}.`);
            }}
          />
        </ScrollReveal>

        <ScrollReveal index={1} className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-fg/50">All Bills</h2>
          {bills.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-fg/8 bg-surface p-8 text-center shadow-card">
              <p className="text-sm font-medium text-fg/70">No bills yet.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {sorted.map((bill) => (
                <BillingAdminRow
                  key={bill.id}
                  bill={bill}
                  pkg={packages.find((p) => p.id === bill.packageId)}
                  customerName={customerName(bill.accountCode)}
                  onAddCharge={(label, amount) => {
                    addLineItemToBill(bill.packageId, { label, amount });
                    setToastMessage(`Added ${label} (${formatCurrency(amount)}) to ${customerName(bill.accountCode)}'s bill.`);
                  }}
                  onMarkPaid={() => {
                    markBillPaidByAdmin(bill.id);
                    setToastMessage(`Marked bill for ${customerName(bill.accountCode)} as paid.`);
                  }}
                />
              ))}
            </ul>
          )}
        </ScrollReveal>
      </main>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

export default function AdminBillingPage() {
  return (
    <RequireAuth role="admin" redirectTo="/admin/login">
      <AdminBillingContent />
    </RequireAuth>
  );
}
