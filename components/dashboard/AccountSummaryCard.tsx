"use client";

import { useAuth } from "@/lib/auth-context";
import { BRANCHES } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/quote-config";

export default function AccountSummaryCard({ walletBalance }: { walletBalance: number }) {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div className="rounded-2xl border border-fg/8 bg-surface p-8 shadow-card">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
          </svg>
        </span>
        <h3 className="text-xl font-bold text-fg">Hello, {firstName}</h3>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-fg/10 bg-fg/5 px-5 py-4">
        <span className="text-sm font-medium text-fg/70">Wallet Balance</span>
        <span className="rounded-full bg-accent/15 px-4 py-1.5 text-sm font-bold text-accent">{formatCurrency(walletBalance)}</span>
      </div>

      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-fg/50">Your Local Branch</h4>
        <ul className="mt-3 space-y-3">
          {BRANCHES.map((branch) => (
            <li key={branch.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-fg/80">{branch.name}</span>
              <a
                href={`tel:${branch.phone.replace(/[^\d+]/g, "")}`}
                data-cursor-hover="Call"
                className="shrink-0 text-fg/50 transition-colors hover:text-accent"
              >
                {branch.phone}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
