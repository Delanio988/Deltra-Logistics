import Link from "next/link";
import Wordmark from "@/components/ui/Wordmark";
import MagneticButton from "@/components/ui/MagneticButton";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/siteConfig";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-16 text-center text-fg">
      <Link href="/" data-cursor-hover="Home">
        <Wordmark className="h-8" />
      </Link>
      <p className="mt-10 text-xs font-semibold uppercase tracking-widest text-accent">404</p>
      <h1 className="mt-4 text-display-sm font-extrabold text-fg">Page not found</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-fg/60">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved. If you followed a
        link to get here, let us know at{" "}
        <a href={CONTACT_EMAIL_HREF} className="text-accent hover:text-accent-dark">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
      <div className="mt-8">
        <MagneticButton href="/" cursorLabel="Home" className="bg-accent text-navy-950 shadow-accent hover:bg-accent-dark hover:text-white">
          Go home
        </MagneticButton>
      </div>
    </div>
  );
}
