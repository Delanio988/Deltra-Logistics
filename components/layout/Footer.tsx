"use client";

import { useId, useState, type FormEvent } from "react";
import { NAV_LINKS, SERVICES } from "@/lib/data";
import Wordmark from "@/components/ui/Wordmark";

const SOCIALS = [
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "X", href: "https://x.com" },
  { label: "Instagram", href: "https://instagram.com" },
] as const;

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputId = useId();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: wire up to a real newsletter provider (Mailchimp, Klaviyo, etc.)
    setSubmitted(true);
  };

  return (
    <footer id="contact" className="bg-bg pt-24 text-fg">
      <div className="mx-auto max-w-container px-6 lg:px-12">
        <div className="grid grid-cols-2 gap-12 pb-16 sm:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-4 lg:col-span-2">
            <Wordmark className="h-10" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-fg/55">
              Global shipping and logistics, engineered for reliability — ocean, air, and
              ground freight across 180+ countries.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 max-w-sm">
              <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
                Get logistics insights
              </label>
              <div className="mt-3 flex gap-2">
                <input
                  id={inputId}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
                />
                <button
                  type="submit"
                  data-cursor-hover="Join"
                  className="shrink-0 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-accent-dark hover:text-white"
                >
                  Join
                </button>
              </div>
              <p role="status" className="mt-2 text-xs text-gold">
                {submitted ? "Thanks — you're subscribed." : " "}
              </p>
            </form>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-fg/50">Company</h3>
            <ul className="mt-5 space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-fg/70 transition-colors hover:text-accent">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-fg/50">Services</h3>
            <ul className="mt-5 space-y-3">
              {SERVICES.slice(0, 5).map((service) => (
                <li key={service.id}>
                  <a href="#services" className="text-sm text-fg/70 transition-colors hover:text-accent">
                    {service.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-fg/50">Contact</h3>
            <ul className="mt-5 space-y-3 text-sm text-fg/70">
              <li>
                <a href="mailto:quotes@deltralogistics.com" className="transition-colors hover:text-accent">
                  quotes@deltralogistics.com
                </a>
              </li>
              <li>
                <a href="tel:+18005551234" className="transition-colors hover:text-accent">
                  +1 (800) 555-1234
                </a>
              </li>
              <li className="text-fg/50">TODO: HQ address</li>
            </ul>
            <div className="mt-6 flex gap-4">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor-hover={social.label}
                  className="text-xs font-medium uppercase tracking-wide text-fg/50 transition-colors hover:text-accent"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-fg/10 py-8 text-xs text-fg/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Deltra Logistics. All rights reserved.</p>
          <p>Placeholder brand — swap name, logo, and legal copy before launch.</p>
        </div>
      </div>

      {/* Oversized wordmark — purely decorative, clipped so it never scrolls the page horizontally */}
      <div aria-hidden className="overflow-hidden">
        <p className="translate-y-[0.12em] select-none whitespace-nowrap px-6 text-center text-[18vw] font-extrabold leading-none tracking-tighter text-fg/[0.04] lg:text-[13vw]">
          DELTRA
        </p>
      </div>
    </footer>
  );
}
