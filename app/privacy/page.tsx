import type { Metadata } from "next";
import Link from "next/link";
import Wordmark from "@/components/ui/Wordmark";
import BackButton from "@/components/ui/BackButton";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Privacy Policy | Deltra Logistics",
};

const EFFECTIVE_DATE = "[Effective date]";
const COMPANY_LEGAL_NAME = "[Company legal name]";
const GOVERNING_LAW = "[Governing law jurisdiction]";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-navy-radial px-6 py-16 text-fg">
      <div className="mx-auto max-w-2xl">
        <BackButton href="/" label="Back to home" className="-ml-3 mb-4" />
        <Link href="/" data-cursor-hover="Home">
          <Wordmark className="h-8" />
        </Link>
        <h1 className="mt-10 text-display-sm font-extrabold text-fg">Privacy Policy</h1>
        <p className="mt-3 text-sm text-fg/50">Last updated: {EFFECTIVE_DATE}</p>

        <div className="mt-6 space-y-6 rounded-2xl border border-fg/8 bg-surface p-8 text-sm leading-relaxed text-fg/65 shadow-card">
          <p>
            This Privacy Policy explains how {COMPANY_LEGAL_NAME} (&ldquo;Deltra Logistics,&rdquo;
            &ldquo;we,&rdquo; &ldquo;us&rdquo;) collects, uses, and protects your information when
            you use our package-forwarding service.
          </p>

          <section>
            <h2 className="text-base font-bold text-fg">1. Information We Collect</h2>
            <p className="mt-2">We collect:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Account information: name, email address, phone number, and password.</li>
              <li>Shipment information: package tracking numbers, merchant, description, weight, and purchase invoices you upload.</li>
              <li>Billing information: wallet transactions, payment records, and billing history. We do not store full payment card numbers ourselves — card and bank payments are processed by a third-party payment provider.</li>
              <li>Communications: messages sent through your dashboard and support correspondence.</li>
              <li>Usage data: log and device information collected automatically when you use the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">2. How We Use Your Information</h2>
            <p className="mt-2">We use your information to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Receive, process, and ship your packages, and clear them through customs.</li>
              <li>Calculate and collect shipping fees and customs duties.</li>
              <li>Send account, shipment, and billing notifications by email, SMS, or WhatsApp.</li>
              <li>Respond to support requests.</li>
              <li>Detect and prevent fraud and abuse of the Service.</li>
              <li>Comply with legal and customs reporting obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">3. Who We Share It With</h2>
            <p className="mt-2">We share information with:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Our database and authentication provider (Supabase), which stores your account and shipment data.</li>
              <li>Email and SMS/WhatsApp providers, to deliver notifications you&rsquo;ve been sent.</li>
              <li>Payment processors, to process card or bank payments.</li>
              <li>Jamaican customs authorities and carriers, as required to clear and deliver your shipments.</li>
              <li>Law enforcement or regulators, where required by law.</li>
            </ul>
            <p className="mt-2">We do not sell your personal information.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">4. Data Retention</h2>
            <p className="mt-2">
              We retain your account and shipment records for as long as your account is active and
              for a reasonable period afterward to meet accounting, customs, and legal obligations.
              You may request deletion of your account as described below.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">5. Your Rights</h2>
            <p className="mt-2">
              You can access and update most of your account information directly from your
              dashboard. To request a copy of your data, correction, or deletion of your account,
              contact us at the email below. We will respond within a reasonable time, subject to
              our legal obligation to retain certain shipment and billing records.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">6. Security</h2>
            <p className="mt-2">
              We use industry-standard safeguards, including encrypted connections, database access
              controls, and role-based permissions, to protect your information. No method of
              transmission or storage is completely secure, and we cannot guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">7. Cookies</h2>
            <p className="mt-2">
              We use essential cookies to keep you signed in and to remember your theme preference.
              We do not use third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">8. Changes to This Policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. Material changes will be
              communicated through the dashboard or by email.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">9. Governing Law</h2>
            <p className="mt-2">This Policy is governed by the laws of {GOVERNING_LAW}.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">10. Contact</h2>
            <p className="mt-2">
              Questions or requests regarding this Policy can be sent to{" "}
              <a href={CONTACT_EMAIL_HREF} className="text-accent hover:text-accent-dark">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>

        <Link href="/signup" className="mt-8 inline-block font-semibold text-accent hover:text-accent-dark">
          &larr; Back to sign up
        </Link>
      </div>
    </div>
  );
}
