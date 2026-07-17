"use client";

import type { Package } from "@/lib/dashboard-data";
import { formatInvoiceValue, type Invoice, type InvoiceStatus } from "@/lib/invoices";
import { isThumbnailableImage } from "@/lib/uploads";
import InvoiceStatusBadge from "@/components/ui/InvoiceStatusBadge";
import InvoiceReviewActions from "@/components/admin/InvoiceReviewActions";

const FileIcon = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path d="M6 3h9l3 3v15H6z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
  </svg>
);

type InvoiceReviewRowProps = {
  invoice: Invoice;
  pkg: Package | undefined;
  customerName: string;
  onReview: (invoiceId: string, decision: Extract<InvoiceStatus, "approved" | "rejected">, rejectionReason?: string) => void;
  onOpenViewer: (invoice: Invoice) => void;
};

/** One row in /admin/invoices: a thumbnail of the first file + a "View"
 *  button opening the shared lightbox (which can page through every file),
 *  plus inline approve/reject controls for admins who don't need the full
 *  viewer. */
export default function InvoiceReviewRow({ invoice, pkg, customerName, onReview, onOpenViewer }: InvoiceReviewRowProps) {
  const firstFile = invoice.files[0];

  return (
    <div className="rounded-2xl border border-fg/8 bg-surface p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-fg">{customerName}</span>
          <span className="font-mono text-sm text-fg/60">{pkg?.trackingNumber ?? "—"}</span>
          <InvoiceStatusBadge status={invoice.status} />
          {invoice.status === "pending" && invoice.hasUnreviewedChanges && (
            <span className="rounded-full border border-fg/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-fg/50">
              Updated by customer
            </span>
          )}
        </div>
        <span className="text-xs text-fg/40">Submitted {invoice.submittedAt}</span>
      </div>

      {pkg && (
        <p className="mt-2 text-sm text-fg/70">
          {pkg.merchant} — {pkg.description}
        </p>
      )}
      {(invoice.merchant || invoice.value !== undefined) && (
        <p className="mt-1 text-sm text-fg/50">
          {invoice.merchant && <>Purchased from {invoice.merchant}</>}
          {invoice.merchant && invoice.value !== undefined && " · "}
          {invoice.value !== undefined && formatInvoiceValue(invoice.value, invoice.currency ?? "USD")}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4">
        {firstFile && (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-fg/10 bg-fg/5" aria-hidden>
            {firstFile.url && isThumbnailableImage(firstFile.type) ? (
              // eslint-disable-next-line @next/next/no-img-element -- transient blob: thumbnail
              <img src={firstFile.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-fg/40">{FileIcon}</span>
            )}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-fg/70">
            {invoice.files.length} file{invoice.files.length === 1 ? "" : "s"}
            {invoice.files.length > 1 && ` — ${firstFile?.name} + ${invoice.files.length - 1} more`}
            {invoice.files.length === 1 && ` — ${firstFile?.name}`}
          </p>
          {!invoice.files.some((f) => f.url) && (
            <p className="text-xs text-fg/35">Preview unavailable after reload — demo storage only.</p>
          )}
          <button
            type="button"
            onClick={() => onOpenViewer(invoice)}
            data-cursor-hover="View"
            className="mt-1 rounded-full border border-fg/15 px-4 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
          >
            View
          </button>
        </div>
      </div>

      {invoice.status === "rejected" && invoice.rejectionReason && (
        <p className="mt-3 text-xs text-fg/60">
          <span className="font-semibold text-accent-text">Reason: </span>
          {invoice.rejectionReason}
        </p>
      )}

      {invoice.status === "pending" && (
        <div className="mt-4">
          <InvoiceReviewActions
            status={invoice.status}
            onApprove={() => onReview(invoice.id, "approved")}
            onReject={(reason) => onReview(invoice.id, "rejected", reason)}
          />
        </div>
      )}
    </div>
  );
}
