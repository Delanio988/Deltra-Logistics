import Link from "next/link";

type AdminDashboardBadgesProps = {
  pendingInvoiceCount: number;
  billsAwaitingCollectionCount: number;
};

export default function AdminDashboardBadges({ pendingInvoiceCount, billsAwaitingCollectionCount }: AdminDashboardBadgesProps) {
  if (pendingInvoiceCount === 0 && billsAwaitingCollectionCount === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {pendingInvoiceCount > 0 && (
        <Link
          href="/admin/invoices"
          data-cursor-hover="Review"
          className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
        >
          {pendingInvoiceCount} invoice{pendingInvoiceCount === 1 ? "" : "s"} awaiting review → Review invoices
        </Link>
      )}
      {billsAwaitingCollectionCount > 0 && (
        <Link
          href="/admin/billing"
          data-cursor-hover="Billing"
          className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent-text transition-colors hover:bg-accent/20"
        >
          {billsAwaitingCollectionCount} bill{billsAwaitingCollectionCount === 1 ? "" : "s"} awaiting collection → Review billing
        </Link>
      )}
    </div>
  );
}
