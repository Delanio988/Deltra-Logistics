"use client";

import { useEffect } from "react";
import Link from "next/link";
import Wordmark from "@/components/ui/Wordmark";
import MagneticButton from "@/components/ui/MagneticButton";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/siteConfig";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-16 text-center text-fg">
      <Link href="/" data-cursor-hover="Home">
        <Wordmark className="h-8" />
      </Link>
      <h1 className="mt-10 text-display-sm font-extrabold text-fg">Something went wrong</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-fg/60">
        We hit an unexpected error loading this page. Try again, or head back home — if it keeps
        happening, let us know at{" "}
        <a href={CONTACT_EMAIL_HREF} className="text-accent hover:text-accent-dark">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <MagneticButton onClick={reset} cursorLabel="Retry" className="bg-accent text-navy-950 shadow-accent hover:bg-accent-dark hover:text-white">
          Try again
        </MagneticButton>
        <MagneticButton href="/" cursorLabel="Home" className="border border-fg/25 text-fg hover:border-accent hover:text-accent">
          Go home
        </MagneticButton>
      </div>
      {error.digest && <p className="mt-8 text-xs text-fg/30">Error ref: {error.digest}</p>}
    </div>
  );
}
