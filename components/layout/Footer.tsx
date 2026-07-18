import Link from "next/link";
import { NAV_LINKS, SERVICES } from "@/lib/data";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF, CONTACT_PHONE, CONTACT_PHONE_HREF, WHATSAPP_URL } from "@/lib/siteConfig";
import Wordmark from "@/components/ui/Wordmark";

export default function Footer() {
  return (
    <footer id="contact" className="bg-bg pt-24 text-fg">
      <div className="mx-auto max-w-container px-6 lg:px-12">
        <div className="grid grid-cols-2 gap-12 pb-16 sm:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-4 lg:col-span-2">
            <Wordmark className="h-10" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-fg/55">
              Shop from any US retailer, ship it to your Deltra address, and we&rsquo;ll
              fly it home to your branch in Jamaica — fast, tracked, and reliable.
            </p>
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
                <a href={CONTACT_EMAIL_HREF} className="transition-colors hover:text-accent">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a href={CONTACT_PHONE_HREF} data-cursor-hover="Call" className="transition-colors hover:text-accent">
                  {CONTACT_PHONE}
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor-hover="WhatsApp"
                  className="transition-colors hover:text-accent"
                >
                  WhatsApp us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-fg/10 py-8 text-xs text-fg/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Deltra Logistics. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/terms" className="transition-colors hover:text-accent">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-accent">
              Privacy
            </Link>
          </div>
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
