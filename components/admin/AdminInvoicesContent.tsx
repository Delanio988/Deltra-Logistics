"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import InvoiceReviewRow from "@/components/admin/InvoiceReviewRow";
import InvoiceLightboxFooter from "@/components/admin/InvoiceLightboxFooter";
import InvoiceLightbox from "@/components/ui/InvoiceLightbox";
import Toast from "@/components/ui/Toast";
import { reviewInvoice } from "@/lib/actions/invoices";
import type { PackageWithCustomer } from "@/lib/packages";
import type { InvoiceWithCustomer } from "@/lib/invoices-data";
import { getNextPendingInvoice, type Invoice, type InvoiceStatus } from "@/lib/invoices";

export default function AdminInvoicesContent({
  invoices,
  packages,
}: {
  invoices: InvoiceWithCustomer[];
  packages: PackageWithCustomer[];
}) {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);

  const handleReview = async (
    invoiceId: string,
    decision: Extract<InvoiceStatus, "approved" | "rejected">,
    rejectionReason?: string
  ) => {
    const result = await reviewInvoice({ invoiceId, decision, rejectionReason });
    if (result.success) {
      setToastMessage(decision === "approved" ? "Invoice approved." : "Invoice rejected.");
      router.refresh();
    } else {
      setToastMessage(result.error);
    }
  };

  // Pending first, so the queue surfaces what needs action.
  const sorted = [...invoices].sort(
    (a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0)
  );

  const viewingInvoice: Invoice | undefined = viewingInvoiceId ? invoices.find((inv) => inv.id === viewingInvoiceId) : undefined;
  const viewingPkg = viewingInvoice ? packages.find((p) => p.id === viewingInvoice.packageId) : undefined;
  const viewingCustomerName = viewingInvoiceId
    ? invoices.find((inv) => inv.id === viewingInvoiceId)?.customerName
    : undefined;
  const nextPending = viewingInvoiceId ? getNextPendingInvoice(invoices, viewingInvoiceId) : undefined;

  return (
    <>
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
              customerName={invoice.customerName}
              onReview={handleReview}
              onOpenViewer={(inv) => setViewingInvoiceId(inv.id)}
            />
          ))
        )}
      </div>

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
                customerName={viewingCustomerName ?? viewingInvoice.accountCode}
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
    </>
  );
}
