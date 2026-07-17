"use client";

import { useId, useState } from "react";
import type { InvoiceStatus } from "@/lib/invoices";

type InvoiceReviewActionsProps = {
  status: InvoiceStatus;
  onApprove: () => void;
  onReject: (reason: string) => void;
};

/**
 * Approve / reject-with-reason control block. Extracted out of
 * InvoiceReviewRow so it can be reused unmodified inside the admin
 * lightbox's footer (InvoiceLightboxFooter) without duplicating the
 * reject-reason expand/confirm/cancel logic in two places. Renders nothing
 * once the invoice has already been reviewed.
 */
export default function InvoiceReviewActions({ status, onApprove, onReject }: InvoiceReviewActionsProps) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const reasonId = useId();

  if (status !== "pending") return null;

  const handleReject = () => {
    if (!reason.trim()) return;
    onReject(reason.trim());
  };

  if (isRejecting) {
    return (
      <div className="space-y-3">
        <label htmlFor={reasonId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
          Rejection reason
        </label>
        <textarea
          id={reasonId}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="e.g. Total amount isn't legible — please re-upload a clearer photo."
          className="w-full rounded-2xl border border-fg/15 bg-fg/5 px-4 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReject}
            disabled={!reason.trim()}
            data-cursor-hover="Confirm"
            className="rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-navy-950 transition-colors hover:bg-accent-dark hover:text-white disabled:opacity-50"
          >
            Confirm rejection
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRejecting(false);
              setReason("");
            }}
            data-cursor-hover="Cancel"
            className="rounded-full border border-fg/15 px-5 py-2.5 text-xs font-semibold text-fg/70 transition-colors hover:border-accent hover:text-accent"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onApprove}
        data-cursor-hover="Approve"
        className="rounded-full border border-green-500/40 bg-green-500/10 px-5 py-2.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-500/20 dark:text-green-400"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => setIsRejecting(true)}
        data-cursor-hover="Reject"
        className="rounded-full border border-accent/40 px-5 py-2.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/10"
      >
        Reject
      </button>
    </div>
  );
}
