"use client";

import { useState } from "react";
import type { Package } from "@/lib/dashboard-data";
import { billBalanceDue, type Bill } from "@/lib/billing";
import { formatCurrency } from "@/lib/quote-config";
import BillStatusBadge from "@/components/ui/BillStatusBadge";

type BillingAdminRowProps = {
  bill: Bill;
  pkg: Package | undefined;
  customerName: string;
  onAddCharge: (label: string, amount: number) => void;
  onMarkPaid: () => void;
};

export default function BillingAdminRow({ bill, pkg, customerName, onAddCharge, onMarkPaid }: BillingAdminRowProps) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  const due = billBalanceDue(bill);
  const isPaid = bill.status === "paid";
  const parsedAmount = parseFloat(amount);
  const canAdd = label.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAddCharge(label.trim(), parsedAmount);
    setLabel("");
    setAmount("");
    setShowForm(false);
  };

  return (
    <li className="rounded-2xl border border-fg/8 bg-surface p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-fg">{customerName}</span>
            <span className="font-mono text-sm text-fg/60">{pkg?.trackingNumber ?? "—"}</span>
            <BillStatusBadge status={bill.status} />
          </div>
          <p className="mt-2 text-sm text-fg/70">
            {pkg?.merchant} — {pkg?.description}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-xs font-semibold uppercase tracking-widest text-fg/45">{isPaid ? "Paid" : "Due"}</span>
          <p className="text-xl font-extrabold text-fg">{formatCurrency(isPaid ? bill.total : due)}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 border-t border-fg/8 pt-4">
        {bill.lineItems.map((item, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="text-fg/60">{item.label}</span>
            <span className="text-fg/80">{formatCurrency(item.amount)}</span>
          </li>
        ))}
      </ul>

      {showForm && (
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-fg/10 bg-fg/5 p-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-fg/50" htmlFor={`charge-label-${bill.id}`}>
              Label
            </label>
            <input
              id={`charge-label-${bill.id}`}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Customs Duty"
              className="mt-1.5 min-h-11 w-48 rounded-full border border-fg/15 bg-surface px-4 py-2 text-sm text-fg outline-none transition-colors focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-fg/50" htmlFor={`charge-amount-${bill.id}`}>
              Amount (J$)
            </label>
            <input
              id={`charge-amount-${bill.id}`}
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="mt-1.5 min-h-11 w-32 rounded-full border border-fg/15 bg-surface px-4 py-2 text-sm text-fg outline-none transition-colors focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            data-cursor-hover="Add"
            className="min-h-11 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-navy-950 transition-colors hover:bg-accent-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            data-cursor-hover="Cancel"
            className="min-h-11 rounded-full border border-fg/15 px-5 py-2.5 text-xs font-semibold text-fg/60 transition-colors hover:border-accent hover:text-accent"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3 border-t border-fg/8 pt-4">
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          data-cursor-hover="Add charge"
          className="min-h-11 rounded-full border border-fg/15 px-5 py-2 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
        >
          Add charge
        </button>
        {!isPaid && (
          <button
            type="button"
            onClick={onMarkPaid}
            data-cursor-hover="Mark paid"
            className="min-h-11 rounded-full border border-green-500/40 px-5 py-2 text-xs font-semibold text-green-700 transition-colors hover:bg-green-500/10 dark:text-green-400"
          >
            Mark paid — cash collected
          </button>
        )}
      </div>
    </li>
  );
}
