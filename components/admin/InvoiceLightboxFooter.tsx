"use client";

import type { Package } from "@/lib/dashboard-data";
import { formatInvoiceValue, type Invoice } from "@/lib/invoices";
import InvoiceStatusBadge from "@/components/ui/InvoiceStatusBadge";
import InvoiceReviewActions from "@/components/admin/InvoiceReviewActions";

type InvoiceLightboxFooterProps = {
  invoice: Invoice;
  pkg: Package | undefined;
  customerName: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onNextPending: () => void;
  hasNextPending: boolean;
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-widest text-fg/40">{label}</p>
    <p className="mt-0.5 text-sm text-fg">{value}</p>
  </div>
);

/**
 * The admin's lightbox `footer` slot: everything needed to verify an
 * invoice against its package without leaving the viewer, plus the
 * approve/reject controls and a shortcut to the next pending invoice.
 */
export default function InvoiceLightboxFooter({
  invoice,
  pkg,
  customerName,
  onApprove,
  onReject,
  onNextPending,
  hasNextPending,
}: InvoiceLightboxFooterProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <InvoiceStatusBadge status={invoice.status} />
        {invoice.status === "pending" && invoice.hasUnreviewedChanges && (
          <span className="rounded-full border border-fg/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-fg/50">
            Updated by customer
          </span>
        )}
        {invoice.status === "rejected" && invoice.rejectionReason && (
          <span className="text-xs text-fg/60">
            <span className="font-semibold text-accent-text">Reason: </span>
            {invoice.rejectionReason}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Customer" value={customerName} />
        <Field label="Account" value={invoice.accountCode} />
        <Field label="Tracking #" value={pkg?.trackingNumber ?? "—"} />
        <Field label="Package" value={pkg?.description ?? "—"} />
        <Field label="Merchant" value={invoice.merchant ?? "—"} />
        <Field label="Declared value" value={invoice.value !== undefined ? formatInvoiceValue(invoice.value, invoice.currency ?? "USD") : "—"} />
        <Field label="Submitted" value={invoice.submittedAt} />
        <Field label="Reviewed" value={invoice.reviewedAt ?? "Not yet"} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-fg/8 pt-4">
        <InvoiceReviewActions status={invoice.status} onApprove={onApprove} onReject={onReject} />
        <button
          type="button"
          onClick={onNextPending}
          disabled={!hasNextPending}
          data-cursor-hover="Next"
          className="rounded-full border border-fg/15 px-5 py-2.5 text-xs font-semibold text-fg/70 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next pending invoice →
        </button>
      </div>
    </div>
  );
}
