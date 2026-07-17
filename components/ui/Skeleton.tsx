import { cn } from "@/lib/utils";

/** Generic pulsing placeholder block — compose a few into a page-shaped
 *  loading state (see RequireAuth's loading branch for the canonical use). */
export default function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-fg/10", className)} />;
}
