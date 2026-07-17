"use client";

import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useModalA11y } from "@/lib/useModalA11y";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { formatCurrency } from "@/lib/quote-config";
import { BRANCHES } from "@/lib/dashboard-data";
import type { PaymentMethod } from "@/lib/billing";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const CloseIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
  </svg>
);

const METHOD_LABELS: Record<PaymentMethod, string> = {
  wallet: "Wallet Balance",
  card: "Card",
  bank: "Bank Transfer",
  cash: "Cash at Branch",
};

type PaymentDialogProps = {
  title: string;
  description?: string;
  /** Fixed amount (bill mode) or the initial value of the editable top-up input. */
  amount: number;
  walletBalance: number;
  /** Bills only — top-ups can't fund themselves from the wallet. */
  allowWallet: boolean;
  /** True only when paying a single bill — allows paying whatever the wallet
   *  covers now and leaving the rest due, rather than requiring full cover. */
  allowPartial: boolean;
  /** Top-up only — lets the customer choose how much to add. */
  editableAmount?: boolean;
  onClose: () => void;
  onConfirmWallet: (amount: number) => void;
  onConfirmCash: (amount: number) => void;
};

export default function PaymentDialog({
  title,
  description,
  amount,
  walletBalance,
  allowWallet,
  allowPartial,
  editableAmount = false,
  onClose,
  onConfirmWallet,
  onConfirmCash,
}: PaymentDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const amountInputId = useId();
  const prefersReducedMotion = useReducedMotion();
  useModalA11y(containerRef, onClose);

  const [method, setMethod] = useState<PaymentMethod>(allowWallet ? "wallet" : "cash");
  const [amountInput, setAmountInput] = useState(String(amount));
  const [confirming, setConfirming] = useState(false);

  const effectiveAmount = editableAmount ? Math.max(0, parseFloat(amountInput) || 0) : amount;
  const shortfall = Math.max(0, effectiveAmount - walletBalance);
  const canPayInFull = walletBalance >= effectiveAmount && effectiveAmount > 0;

  const methods: PaymentMethod[] = [...(allowWallet ? (["wallet"] as const) : []), "card", "bank", "cash"];

  const canContinue =
    method === "cash"
      ? effectiveAmount > 0
      : method === "wallet"
        ? effectiveAmount > 0 && walletBalance > 0 && (canPayInFull || allowPartial)
        : false;

  const handleConfirm = () => {
    if (method === "wallet") onConfirmWallet(effectiveAmount);
    else if (method === "cash") onConfirmCash(effectiveAmount);
    setConfirming(false);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-fg/8 bg-surface p-6 shadow-card outline-none sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={headingId} className="text-xl font-bold text-fg">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-fg/60">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-cursor-hover="Close"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-fg/50 transition-colors hover:bg-fg/5 hover:text-accent"
          >
            {CloseIcon}
          </button>
        </div>

        {editableAmount ? (
          <div className="mt-6">
            <label htmlFor={amountInputId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
              Amount to top up
            </label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-sm font-semibold text-fg/50">
                J$
              </span>
              <input
                id={amountInputId}
                type="number"
                min="0"
                step="100"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="min-h-11 w-full rounded-full border border-fg/15 bg-fg/5 py-3 pl-11 pr-5 text-sm text-fg outline-none transition-colors focus:border-accent"
              />
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-fg/10 bg-fg/5 px-5 py-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-fg/50">Amount due</span>
            <p className="mt-1 text-2xl font-extrabold text-fg">{formatCurrency(effectiveAmount)}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {methods.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              data-cursor-hover={METHOD_LABELS[m]}
              className={cn(
                "min-h-11 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors",
                method === m ? "border-accent bg-accent/10 text-accent-text" : "border-fg/15 text-fg/70 hover:border-accent hover:text-accent"
              )}
            >
              {METHOD_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {method === "wallet" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg/60">Wallet balance</span>
                <span className="font-semibold text-fg">{formatCurrency(walletBalance)}</span>
              </div>
              {effectiveAmount <= 0 ? (
                <p className="text-sm text-fg/50">Enter an amount above.</p>
              ) : canPayInFull ? (
                <p className="text-sm text-fg/60">Your wallet covers this in full.</p>
              ) : walletBalance > 0 && allowPartial ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                  Your balance covers {formatCurrency(walletBalance)} of this — {formatCurrency(shortfall)} will still be
                  due after paying what you can from your wallet.
                </div>
              ) : walletBalance > 0 ? (
                <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-text">
                  Your wallet ({formatCurrency(walletBalance)}) is {formatCurrency(shortfall)} short of the combined
                  total. Top up, or deselect a bill to pay with your wallet.
                </div>
              ) : (
                <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-text">
                  Your wallet balance is J$0.00 — top up or choose another method.
                </div>
              )}
            </div>
          )}

          {(method === "card" || method === "bank") && (
            <div className="rounded-xl border border-fg/10 bg-fg/5 px-5 py-6 text-center">
              <p className="text-sm font-semibold text-fg">{method === "card" ? "Card payments" : "Bank transfer"} coming soon</p>
              <p className="mx-auto mt-2 max-w-sm text-xs text-fg/50">
                You&rsquo;ll be redirected to a secure, PCI-compliant payment page to complete this — we never collect
                card or bank details directly in this app.
              </p>
              {/* TODO: integrate hosted payment processor (redirect/embed —
                  never collect raw card data client-side). */}
            </div>
          )}

          {method === "cash" && (
            <div className="space-y-3">
              <p className="text-sm text-fg/60">
                {editableAmount
                  ? "Pay at any branch below — we'll credit your wallet once the payment is confirmed."
                  : "Pay in cash at any of our branches:"}
              </p>
              <ul className="space-y-2">
                {BRANCHES.map((b) => (
                  <li key={b.name} className="flex items-center justify-between rounded-xl border border-fg/10 bg-fg/5 px-4 py-3 text-sm">
                    <span className="text-fg/80">{b.name}</span>
                    <span className="text-fg/50">{b.phone}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            data-cursor-hover="Cancel"
            className="min-h-11 rounded-full border border-fg/15 px-5 py-2.5 text-sm font-semibold text-fg/70 transition-colors hover:border-accent hover:text-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={!canContinue}
            data-cursor-hover="Continue"
            className="min-h-11 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-navy-950 shadow-accent transition-colors hover:bg-accent-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {method === "cash" ? (editableAmount ? "Confirm — I'll pay at the branch" : "Confirm — I'll pay at the branch") : "Continue"}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {confirming && (
          <ConfirmDialog
            title={method === "cash" ? "Confirm branch payment" : "Confirm payment"}
            message={
              method === "cash"
                ? editableAmount
                  ? `We'll mark ${formatCurrency(effectiveAmount)} as expected at the branch. Your wallet is credited once payment is received.`
                  : `This marks the bill "Pending — Pay at Branch." Bring the amount due to any branch listed.`
                : `Pay ${formatCurrency(Math.min(walletBalance, effectiveAmount))} from your wallet now?`
            }
            confirmLabel="Confirm"
            destructive={false}
            onConfirm={handleConfirm}
            onCancel={() => setConfirming(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
