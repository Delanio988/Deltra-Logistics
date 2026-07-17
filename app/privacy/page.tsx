import type { Metadata } from "next";
import Link from "next/link";
import Wordmark from "@/components/ui/Wordmark";

export const metadata: Metadata = {
  title: "Privacy Policy | Deltra Logistics",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-navy-radial px-6 py-16 text-fg">
      <div className="mx-auto max-w-2xl">
        <Link href="/" data-cursor-hover="Home">
          <Wordmark className="h-8" />
        </Link>
        <h1 className="mt-10 text-display-sm font-extrabold text-fg">Privacy Policy</h1>
        <p className="mt-6 rounded-2xl border border-fg/8 bg-surface p-8 text-sm leading-relaxed text-fg/65 shadow-card">
          TODO: replace with a real Privacy Policy before launch. This
          placeholder page exists so the sign-up form&rsquo;s &ldquo;I agree to
          the Privacy Policy&rdquo; checkbox links somewhere real instead of a
          dead link.
        </p>
        <Link href="/signup" className="mt-8 inline-block font-semibold text-accent hover:text-accent-dark">
          &larr; Back to sign up
        </Link>
      </div>
    </div>
  );
}
