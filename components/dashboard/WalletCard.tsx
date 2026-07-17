import { formatCurrency } from "@/lib/quote-config";

type WalletCardProps = {
  balance: number;
  onTopUp: () => void;
};

export default function WalletCard({ balance, onTopUp }: WalletCardProps) {
  return (
    <div className="rounded-2xl border border-fg/8 bg-surface p-8 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-fg/50">Wallet Balance</h3>
          <p className="mt-3 text-3xl font-extrabold text-fg">{formatCurrency(balance)}</p>
          <p className="mt-1 text-sm text-fg/50">Available to pay bills instantly</p>
        </div>
        <button
          type="button"
          onClick={onTopUp}
          data-cursor-hover="Top Up"
          className="min-h-11 shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy-950 shadow-accent transition-colors hover:bg-accent-dark hover:text-white"
        >
          Top Up
        </button>
      </div>
    </div>
  );
}
