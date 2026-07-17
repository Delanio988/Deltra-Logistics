"use client";

import { useState } from "react";
import { CUSTOMERS } from "@/lib/dashboard-data";

type WalletActionsFormProps = {
  onCredit: (accountCode: string, amount: number, note: string) => void;
  onRefund: (accountCode: string, amount: number, note: string) => void;
};

export default function WalletActionsForm({ onCredit, onRefund }: WalletActionsFormProps) {
  const [accountCode, setAccountCode] = useState(CUSTOMERS[0]?.accountCode ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const parsedAmount = parseFloat(amount);
  const isValid = Boolean(accountCode) && Number.isFinite(parsedAmount) && parsedAmount > 0;

  const reset = () => {
    setAmount("");
    setNote("");
  };

  return (
    <div className="rounded-2xl border border-fg/8 bg-surface p-6 shadow-card sm:p-8">
      <h3 className="text-sm font-bold text-fg">Wallet actions</h3>
      <p className="mt-1 text-xs text-fg/50">Credit a wallet for a branch top-up, or issue a refund.</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-fg/50" htmlFor="wallet-customer">
            Customer
          </label>
          <select
            id="wallet-customer"
            value={accountCode}
            onChange={(e) => setAccountCode(e.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-full border border-fg/15 bg-fg/5 px-4 py-2 text-sm text-fg outline-none transition-colors focus:border-accent"
          >
            {CUSTOMERS.map((c) => (
              <option key={c.accountCode} value={c.accountCode} className="bg-surface text-fg">
                {c.name} ({c.accountCode})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-fg/50" htmlFor="wallet-amount">
            Amount (J$)
          </label>
          <input
            id="wallet-amount"
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="mt-1.5 min-h-11 w-full rounded-full border border-fg/15 bg-fg/5 px-4 py-2 text-sm text-fg outline-none transition-colors focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-fg/50" htmlFor="wallet-note">
            Note (optional)
          </label>
          <input
            id="wallet-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paid at Fairview branch"
            className="mt-1.5 min-h-11 w-full rounded-full border border-fg/15 bg-fg/5 px-4 py-2 text-sm text-fg outline-none transition-colors focus:border-accent"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!isValid}
          onClick={() => {
            onCredit(accountCode, parsedAmount, note);
            reset();
          }}
          data-cursor-hover="Credit Wallet"
          className="min-h-11 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-navy-950 shadow-accent transition-colors hover:bg-accent-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Credit Wallet
        </button>
        <button
          type="button"
          disabled={!isValid}
          onClick={() => {
            onRefund(accountCode, parsedAmount, note);
            reset();
          }}
          data-cursor-hover="Issue Refund"
          className="min-h-11 rounded-full border border-fg/15 px-6 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Issue Refund
        </button>
      </div>
    </div>
  );
}
