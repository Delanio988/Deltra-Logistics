import Link from "next/link";

type BackButtonProps = {
  href: string;
  label: string;
  className?: string;
};

const ArrowIcon = (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M19 12H5M5 12l6-6M5 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Shared back-navigation control — always a real link to an explicit route
 * (never router.back()), so the destination is predictable regardless of
 * how the user arrived at the current page.
 */
export default function BackButton({ href, label, className }: BackButtonProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      data-cursor-hover={label}
      className={`group inline-flex min-h-11 items-center gap-2 rounded-full py-2 pr-3 text-sm font-medium text-fg/60 outline-none transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${className ?? ""}`}
    >
      <span className="transition-transform duration-200 motion-reduce:transition-none group-hover:-translate-x-0.5">
        {ArrowIcon}
      </span>
      {label}
    </Link>
  );
}
