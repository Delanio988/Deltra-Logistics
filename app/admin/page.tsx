"use client";

import { useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminHeader from "@/components/admin/AdminHeader";
import AddPackageForm from "@/components/admin/AddPackageForm";
import PackagesTable from "@/components/admin/PackagesTable";
import Toast from "@/components/ui/Toast";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useDataStore } from "@/lib/data-store";

function AdminContent() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { invoices, bills } = useDataStore();
  const pendingInvoiceCount = invoices.filter((inv) => inv.status === "pending").length;
  const billsAwaitingCollectionCount = bills.filter((b) => b.status !== "paid").length;

  return (
    <div className="min-h-screen bg-bg">
      <AdminHeader />

      <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
        <ScrollReveal direction="none">
          <h1 className="text-display-sm font-extrabold text-fg">Warehouse dashboard</h1>
          <p className="mt-2 text-fg/60">Add packages and keep customers updated.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {pendingInvoiceCount > 0 && (
              <Link
                href="/admin/invoices"
                data-cursor-hover="Review"
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
              >
                {pendingInvoiceCount} invoice{pendingInvoiceCount === 1 ? "" : "s"} awaiting review → Review invoices
              </Link>
            )}
            {billsAwaitingCollectionCount > 0 && (
              <Link
                href="/admin/billing"
                data-cursor-hover="Billing"
                className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent-text transition-colors hover:bg-accent/20"
              >
                {billsAwaitingCollectionCount} bill{billsAwaitingCollectionCount === 1 ? "" : "s"} awaiting collection → Review billing
              </Link>
            )}
          </div>
        </ScrollReveal>

        <section className="mt-10">
          <AddPackageForm onSuccess={setToastMessage} />
        </section>

        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-fg/50">All Packages</h2>
          <div className="mt-4">
            <PackagesTable onStatusChange={setToastMessage} />
          </div>
        </section>
      </main>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth role="admin" redirectTo="/admin/login">
      <AdminContent />
    </RequireAuth>
  );
}
