"use client";

import { useMemo, useState } from "react";
import type { Transaction, TransactionType } from "@/lib/billing";
import { formatCurrency } from "@/lib/quote-config";

const PAGE_SIZE = 10;

const TYPE_LABELS: Record<TransactionType, string> = {
  payment: "Payment",
  topup: "Wallet Top-Up",
  refund: "Refund",
  charge: "Charge",
};

type SortKey = "date" | "amount";

type TransactionHistoryTableProps = {
  transactions: Transaction[];
  onViewReceipt: (txn: Transaction) => void;
};

function toCsvValue(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

const inputClasses =
  "mt-1.5 min-h-11 rounded-full border border-fg/15 bg-fg/5 px-4 py-2 text-sm text-fg outline-none transition-colors focus:border-accent";

export default function TransactionHistoryTable({ transactions, onViewReceipt }: TransactionHistoryTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    return transactions.filter((txn) => {
      if (typeFilter !== "all" && txn.type !== typeFilter) return false;
      if (term) {
        const haystack = `${txn.description} ${txn.reference ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      const txnDate = new Date(txn.createdAt);
      if (from && txnDate < from) return false;
      if (to && txnDate > to) return false;
      return true;
    });
  }, [transactions, search, typeFilter, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "amount") return (a.amount - b.amount) * dir;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  const handleExportCsv = () => {
    const header = ["Date", "Type", "Description", "Reference", "Amount", "Balance After"];
    const rows = transactions.map((t) => [
      t.createdAt,
      TYPE_LABELS[t.type],
      t.description,
      t.reference ?? "",
      t.amount.toFixed(2),
      t.balanceAfter.toFixed(2),
    ]);
    const csv = [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "deltra-transaction-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-fg/8 bg-surface p-8 text-center shadow-card">
        <p className="text-sm font-medium text-fg/70">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-fg/8 bg-surface p-6 shadow-card sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-fg/50" htmlFor="txn-search">
              Search
            </label>
            <input
              id="txn-search"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              placeholder="Tracking or reference"
              className={`${inputClasses} w-48`}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-fg/50" htmlFor="txn-type">
              Type
            </label>
            <select
              id="txn-type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as "all" | TransactionType);
                resetPage();
              }}
              className={inputClasses}
            >
              <option value="all" className="bg-surface text-fg">
                All types
              </option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value} className="bg-surface text-fg">
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-fg/50" htmlFor="txn-from">
              From
            </label>
            <input
              id="txn-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                resetPage();
              }}
              className={inputClasses}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-fg/50" htmlFor="txn-to">
              To
            </label>
            <input
              id="txn-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                resetPage();
              }}
              className={inputClasses}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-fg/50" htmlFor="txn-sort">
              Sort by
            </label>
            <select
              id="txn-sort"
              value={`${sortKey}-${sortDir}`}
              onChange={(e) => {
                const [key, dir] = e.target.value.split("-") as [SortKey, "asc" | "desc"];
                setSortKey(key);
                setSortDir(dir);
              }}
              className={inputClasses}
            >
              <option value="date-desc" className="bg-surface text-fg">Newest first</option>
              <option value="date-asc" className="bg-surface text-fg">Oldest first</option>
              <option value="amount-desc" className="bg-surface text-fg">Amount: high to low</option>
              <option value="amount-asc" className="bg-surface text-fg">Amount: low to high</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          data-cursor-hover="Export"
          className="min-h-11 shrink-0 rounded-full border border-fg/15 px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
        >
          Export to CSV
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-8 text-center text-sm text-fg/50">No transactions match your filters.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="mt-6 hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-fg/10 text-xs font-semibold uppercase tracking-widest text-fg/45">
                  <th className="py-3 pr-4 font-semibold">Date</th>
                  <th className="py-3 pr-4 font-semibold">Type</th>
                  <th className="py-3 pr-4 font-semibold">Description</th>
                  <th className="py-3 pr-4 text-right font-semibold">Amount</th>
                  <th className="py-3 pr-4 text-right font-semibold">Balance</th>
                  <th className="py-3 pr-4 text-right font-semibold">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fg/8">
                {pageRows.map((txn) => (
                  <tr key={txn.id}>
                    <td className="py-3 pr-4 text-fg/70">{txn.createdAt}</td>
                    <td className="py-3 pr-4 text-fg/70">{TYPE_LABELS[txn.type]}</td>
                    <td className="py-3 pr-4 text-fg/80">
                      {txn.description}
                      {txn.reference && <span className="ml-2 font-mono text-xs text-fg/40">{txn.reference}</span>}
                    </td>
                    <td
                      className={`py-3 pr-4 text-right font-semibold ${
                        txn.amount >= 0 ? "text-green-600 dark:text-green-400" : "text-accent-text"
                      }`}
                    >
                      {txn.amount >= 0 ? "+" : "−"}
                      {formatCurrency(Math.abs(txn.amount))}
                    </td>
                    <td className="py-3 pr-4 text-right text-fg/70">{formatCurrency(txn.balanceAfter)}</td>
                    <td className="py-3 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(txn)}
                        data-cursor-hover="Receipt"
                        className="rounded-full border border-fg/15 px-4 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards — reflow instead of horizontal scroll (too many columns to scroll comfortably) */}
          <ul className="mt-6 space-y-3 lg:hidden">
            {pageRows.map((txn) => (
              <li key={txn.id} className="rounded-xl border border-fg/10 bg-fg/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-fg/45">{TYPE_LABELS[txn.type]}</span>
                  <span
                    className={`font-semibold ${txn.amount >= 0 ? "text-green-600 dark:text-green-400" : "text-accent-text"}`}
                  >
                    {txn.amount >= 0 ? "+" : "−"}
                    {formatCurrency(Math.abs(txn.amount))}
                  </span>
                </div>
                <p className="mt-2 text-sm text-fg/80">{txn.description}</p>
                {txn.reference && <p className="mt-0.5 font-mono text-xs text-fg/40">{txn.reference}</p>}
                <div className="mt-3 flex items-center justify-between text-xs text-fg/50">
                  <span>{txn.createdAt}</span>
                  <span>Balance {formatCurrency(txn.balanceAfter)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onViewReceipt(txn)}
                  data-cursor-hover="Receipt"
                  className="mt-3 min-h-11 w-full rounded-full border border-fg/15 px-4 py-2 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
                >
                  View Receipt
                </button>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={clampedPage <= 1}
                data-cursor-hover="Previous"
                className="min-h-11 rounded-full border border-fg/15 px-5 py-2 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-xs text-fg/50">
                Page {clampedPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={clampedPage >= totalPages}
                data-cursor-hover="Next"
                className="min-h-11 rounded-full border border-fg/15 px-5 py-2 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
