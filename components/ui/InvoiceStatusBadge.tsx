import type { InvoiceStatus } from "@/lib/invoices";
import { cn } from "@/lib/utils";

const STYLES: Record<InvoiceStatus, string> = {
  // Explicit light/dark shades (rather than one fixed color, like the
  // pre-existing "Delivered" badge in PackageCard.tsx) so this reads at AA
  // contrast against a white card in light mode, not just on dark surfaces.
  pending: "border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  approved: "border border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400",
  rejected: "border border-accent/40 bg-accent/10 text-accent-text",
};

const LABELS: Record<InvoiceStatus, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
  className?: string;
};

export default function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", STYLES[status], className)}>
      {LABELS[status]}
    </span>
  );
}
