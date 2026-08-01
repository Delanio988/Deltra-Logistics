import type { PreAlertStatus } from "@/lib/pre-alerts";
import { cn } from "@/lib/utils";

const STYLES: Record<PreAlertStatus, string> = {
  pending: "border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  matched: "border border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400",
  expired: "border border-fg/15 bg-fg/5 text-fg/50",
};

const LABELS: Record<PreAlertStatus, string> = {
  pending: "Awaiting Arrival",
  matched: "Matched — Received",
  expired: "Expired",
};

type PreAlertStatusBadgeProps = {
  status: PreAlertStatus;
  className?: string;
};

export default function PreAlertStatusBadge({ status, className }: PreAlertStatusBadgeProps) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", STYLES[status], className)}>
      {LABELS[status]}
    </span>
  );
}
