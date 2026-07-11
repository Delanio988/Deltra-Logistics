import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  accentClassName?: string;
};

/** Single source of truth for the brand name so it's a one-place swap later. */
export default function Wordmark({ className, accentClassName }: WordmarkProps) {
  return (
    <span className={cn("font-extrabold tracking-tight", className)}>
      DELTRA <span className={cn("text-accent", accentClassName)}>LOGISTICS</span>
    </span>
  );
}
