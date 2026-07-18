"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import BillingAdminRow from "@/components/admin/BillingAdminRow";
import WalletActionsForm from "@/components/admin/WalletActionsForm";
import Toast from "@/components/ui/Toast";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { addLineItemToBill, markBillPaidByAdmin, creditWallet, issueRefund } from "@/lib/actions/billing";
import type { BillWithCustomer } from "@/lib/billing-data";
import type { PackageWithCustomer } from "@/lib/packages";
import type { Customer } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/quote-config";

type AdminBillingContentProps = {
  bills: BillWithCustomer[];
  packages: PackageWithCustomer[];
  customers: Customer[];
};

export default function AdminBillingContent({ bills, packages, customers }: AdminBillingContentProps) {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const customerName = (accountCode: string) => customers.find((c) => c.accountCode === accountCode)?.name ?? accountCode;

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
            customers={customers}
            onCredit={async (accountCode, amount, note) => {
              const result = await creditWallet({ accountCode, amount, note });
              if (!result.success) {
                setToastMessage(result.error);
              } else {
                setToastMessage(`Credited ${formatCurrency(amount)} to ${customerName(accountCode)}'s wallet.`);
                router.refresh();
              }
            }}
            onRefund={async (accountCode, amount, note) => {
              const result = await issueRefund({ accountCode, amount, note });
              if (!result.success) {
                setToastMessage(result.error);
              } else {
                setToastMessage(`Refunded ${formatCurrency(amount)} to ${customerName(accountCode)}.`);
                router.refresh();
              }
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
                  customerName={bill.customerName || customerName(bill.accountCode)}
                  onAddCharge={async (label, amount) => {
                    const result = await addLineItemToBill({ billId: bill.id, label, amount });
                    if (!result.success) {
                      setToastMessage(result.error);
                    } else {
                      setToastMessage(`Added ${label} (${formatCurrency(amount)}) to ${bill.customerName}'s bill.`);
                      router.refresh();
                    }
                  }}
                  onMarkPaid={async () => {
                    const result = await markBillPaidByAdmin({ billId: bill.id });
                    if (!result.success) {
                      setToastMessage(result.error);
                    } else {
                      setToastMessage(`Marked bill for ${bill.customerName} as paid.`);
                      router.refresh();
                    }
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
