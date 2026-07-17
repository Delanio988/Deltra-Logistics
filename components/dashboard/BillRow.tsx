import type { Package } from "@/lib/dashboard-data";
import { billBalanceDue, type Bill } from "@/lib/billing";
import { formatCurrency } from "@/lib/quote-config";
import BillStatusBadge from "@/components/ui/BillStatusBadge";

type BillRowProps = {
  bill: Bill;
  pkg: Package | undefined;
  selected: boolean;
  onToggleSelect: () => void;
  onPayNow: () => void;
};

export default function BillRow({ bill, pkg, selected, onToggleSelect, onPayNow }: BillRowProps) {
  const due = billBalanceDue(bill);
  const isPaid = bill.status === "paid";

  return (
    <li className="rounded-2xl border border-fg/8 bg-surface p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <label className="-m-3 flex shrink-0 cursor-pointer items-center justify-center rounded-full p-3 transition-colors hover:bg-fg/5 has-[:disabled]:cursor-not-allowed">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              disabled={isPaid}
              aria-label={`Select bill for ${pkg?.trackingNumber ?? "package"}`}
              className="h-5 w-5 rounded border-fg/25 accent-accent disabled:cursor-not-allowed disabled:opacity-30"
            />
          </label>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm font-semibold text-fg">{pkg?.trackingNumber ?? "—"}</span>
              <BillStatusBadge status={bill.status} />
            </div>
            <p className="mt-1 text-sm text-fg/70">
              {pkg?.merchant} — {pkg?.description}
            </p>
            {pkg && <p className="mt-0.5 text-xs text-fg/45">{pkg.weightLb} lb · Due {bill.dueDate}</p>}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold uppercase tracking-widest text-fg/45">
            {isPaid ? "Paid" : "Total Due"}
          </span>
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
        {bill.amountPaid > 0 && !isPaid && (
          <li className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
            <span>Paid so far</span>
            <span>−{formatCurrency(bill.amountPaid)}</span>
          </li>
        )}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-fg/8 pt-4">
        {bill.status === "pending_branch" ? (
          <p className="text-xs text-fg/50">You chose to pay this in cash at the branch.</p>
        ) : (
          <span aria-hidden />
        )}
        {!isPaid && (
          <button
            type="button"
            onClick={onPayNow}
            data-cursor-hover="Pay Now"
            className="min-h-11 shrink-0 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-navy-950 shadow-accent transition-colors hover:bg-accent-dark hover:text-white"
          >
            Pay Now
          </button>
        )}
        {isPaid && bill.paidAt && <p className="text-xs text-fg/45">Paid {bill.paidAt}</p>}
      </div>
    </li>
  );
}
