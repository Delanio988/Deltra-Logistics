"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminHeader from "@/components/admin/AdminHeader";
import InvoiceReviewRow from "@/components/admin/InvoiceReviewRow";
import InvoiceLightboxFooter from "@/components/admin/InvoiceLightboxFooter";
import InvoiceLightbox from "@/components/ui/InvoiceLightbox";
import Toast from "@/components/ui/Toast";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useDataStore } from "@/lib/data-store";
import { CUSTOMERS } from "@/lib/dashboard-data";
import { getNextPendingInvoice, type Invoice, type InvoiceStatus } from "@/lib/invoices";

function AdminInvoicesContent() {
  const { invoices, packages, reviewInvoice } = useDataStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);

  const customerName = (accountCode: string) => CUSTOMERS.find((c) => c.accountCode === accountCode)?.name ?? accountCode;

  const handleReview = (invoiceId: string, decision: Extract<InvoiceStatus, "approved" | "rejected">, rejectionReason?: string) => {
    reviewInvoice(invoiceId, decision, rejectionReason);
    setToastMessage(decision === "approved" ? "Invoice approved." : "Invoice rejected.");
  };

  // Pending first, so the queue surfaces what needs action.
  const sorted = [...invoices].sort(
    (a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0)
  );

  // Derived from the live store by id (not a frozen snapshot) so the
  // lightbox reflects a review decision the instant it happens.
  const viewingInvoice: Invoice | undefined = viewingInvoiceId ? invoices.find((inv) => inv.id === viewingInvoiceId) : undefined;
  const viewingPkg = viewingInvoice ? packages.find((p) => p.id === viewingInvoice.packageId) : undefined;
  const nextPending = viewingInvoiceId ? getNextPendingInvoice(invoices, viewingInvoiceId) : undefined;

  return (
    <div className="min-h-screen bg-bg">
      <AdminHeader />

      <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
        <ScrollReveal direction="none">
          <h1 className="text-display-sm font-extrabold text-fg">Invoices</h1>
          <p className="mt-2 text-fg/60">Review customer-submitted invoices and approve or reject them.</p>
        </ScrollReveal>

        <div className="mt-10 space-y-4">
          {invoices.length === 0 ? (
            <div className="rounded-2xl border border-fg/8 bg-surface p-8 text-center text-sm text-fg/50 shadow-card">
              No invoices submitted yet.
            </div>
          ) : (
            sorted.map((invoice) => (
              <InvoiceReviewRow
                key={invoice.id}
                invoice={invoice}
                pkg={packages.find((p) => p.id === invoice.packageId)}
                customerName={customerName(invoice.accountCode)}
                onReview={handleReview}
                onOpenViewer={(inv) => setViewingInvoiceId(inv.id)}
              />
            ))
          )}
        </div>
      </main>

      <AnimatePresence>
        {viewingInvoice && (
          <InvoiceLightbox
            key={viewingInvoice.id}
            files={viewingInvoice.files}
            trackingNumber={viewingPkg?.trackingNumber ?? "—"}
            description={viewingPkg?.description ?? "—"}
            statusHistory={viewingInvoice.statusHistory}
            onClose={() => setViewingInvoiceId(null)}
            footer={
              <InvoiceLightboxFooter
                invoice={viewingInvoice}
                pkg={viewingPkg}
                customerName={customerName(viewingInvoice.accountCode)}
                onApprove={() => handleReview(viewingInvoice.id, "approved")}
                onReject={(reason) => handleReview(viewingInvoice.id, "rejected", reason)}
                onNextPending={() => setViewingInvoiceId(nextPending ? nextPending.id : null)}
                hasNextPending={Boolean(nextPending)}
              />
            }
          />
        )}
      </AnimatePresence>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

export default function AdminInvoicesPage() {
  return (
    <RequireAuth role="admin" redirectTo="/admin/login">
      <AdminInvoicesContent />
    </RequireAuth>
  );
}
