import { BILL_STATUS_LABELS, type BillStatus } from "@/lib/billing";
import { cn } from "@/lib/utils";

const STYLES: Record<BillStatus, string> = {
  // Explicit light/dark shades (matches InvoiceStatusBadge's approach) so
  // each state reads at AA contrast against a white card in light mode, not
  // just on dark surfaces.
  unpaid: "border border-accent/40 bg-accent/10 text-accent-text",
  partially_paid: "border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  paid: "border border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400",
  pending_branch: "border border-fg/20 bg-fg/8 text-fg/70",
};

type BillStatusBadgeProps = {
  status: BillStatus;
  className?: string;
};

export default function BillStatusBadge({ status, className }: BillStatusBadgeProps) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", STYLES[status], className)}>
      {BILL_STATUS_LABELS[status]}
    </span>
  );
}
