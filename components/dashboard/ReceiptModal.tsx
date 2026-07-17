"use client";

import { useId, useRef } from "react";
import { motion } from "framer-motion";
import { useModalA11y } from "@/lib/useModalA11y";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { formatCurrency } from "@/lib/quote-config";
import type { Transaction } from "@/lib/billing";

const CloseIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
  </svg>
);

const TYPE_LABELS: Record<Transaction["type"], string> = {
  payment: "Payment",
  topup: "Wallet Top-Up",
  refund: "Refund",
  charge: "Charge",
};

type ReceiptModalProps = {
  transaction: Transaction;
  customerName: string;
  onClose: () => void;
};

/** Printable receipt for a single transaction. Scoped print CSS hides
 *  everything on the page except #receipt-print-area, so "Print" produces a
 *  clean single receipt instead of the whole dashboard. */
export default function ReceiptModal({ transaction, customerName, onClose }: ReceiptModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const prefersReducedMotion = useReducedMotion();
  useModalA11y(containerRef, onClose);

  const isCredit = transaction.amount >= 0;

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 print:static print:bg-transparent print:p-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print-area, #receipt-print-area * { visibility: visible; }
          #receipt-print-area { position: fixed; inset: 0; }
        }
      `}</style>
      <motion.div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-2xl border border-fg/8 bg-surface p-6 shadow-card outline-none print:max-w-full print:border-none print:bg-white print:p-8 print:shadow-none"
      >
        <div id="receipt-print-area">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">Deltra Logistics</span>
              <h2 id={headingId} className="mt-1 text-lg font-bold text-fg print:text-navy-950">
                Receipt
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              data-cursor-hover="Close"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-fg/50 transition-colors hover:bg-fg/5 hover:text-accent print:hidden"
            >
              {CloseIcon}
            </button>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-fg/50 print:text-navy-950/60">Reference</dt>
              <dd className="text-right font-mono text-fg print:text-navy-950">{transaction.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg/50 print:text-navy-950/60">Date</dt>
              <dd className="text-fg print:text-navy-950">{transaction.createdAt}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg/50 print:text-navy-950/60">Customer</dt>
              <dd className="text-fg print:text-navy-950">{customerName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg/50 print:text-navy-950/60">Type</dt>
              <dd className="text-fg print:text-navy-950">{TYPE_LABELS[transaction.type]}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg/50 print:text-navy-950/60">Description</dt>
              <dd className="max-w-[60%] text-right text-fg print:text-navy-950">{transaction.description}</dd>
            </div>
            {transaction.reference && (
              <div className="flex justify-between gap-4">
                <dt className="text-fg/50 print:text-navy-950/60">Tracking</dt>
                <dd className="font-mono text-fg print:text-navy-950">{transaction.reference}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 rounded-xl border border-fg/10 bg-fg/5 px-5 py-4 print:border-navy-950/15 print:bg-transparent">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-fg/50 print:text-navy-950/60">Amount</span>
              <span className={isCredit ? "text-lg font-extrabold text-green-600 dark:text-green-400 print:text-green-700" : "text-lg font-extrabold text-accent-text print:text-accent"}>
                {isCredit ? "+" : "−"}
                {formatCurrency(Math.abs(transaction.amount))}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-fg/50 print:text-navy-950/60">Balance after</span>
              <span className="font-semibold text-fg print:text-navy-950">{formatCurrency(transaction.balanceAfter)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            data-cursor-hover="Close"
            className="min-h-11 rounded-full border border-fg/15 px-5 py-2.5 text-sm font-semibold text-fg/70 transition-colors hover:border-accent hover:text-accent"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            data-cursor-hover="Print"
            className="min-h-11 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-navy-950 shadow-accent transition-colors hover:bg-accent-dark hover:text-white"
          >
            Print Receipt
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
