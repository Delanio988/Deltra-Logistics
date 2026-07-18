import type { Metadata } from "next";
import Link from "next/link";
import Wordmark from "@/components/ui/Wordmark";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Terms of Agreement | Deltra Logistics",
};

const EFFECTIVE_DATE = "[Effective date]";
const COMPANY_LEGAL_NAME = "[Company legal name]";
const COMPANY_JURISDICTION = "[Company registration jurisdiction, e.g. Jamaica]";
const GOVERNING_LAW = "[Governing law jurisdiction]";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-navy-radial px-6 py-16 text-fg">
      <div className="mx-auto max-w-2xl">
        <Link href="/" data-cursor-hover="Home">
          <Wordmark className="h-8" />
        </Link>
        <h1 className="mt-10 text-display-sm font-extrabold text-fg">Terms of Agreement</h1>
        <p className="mt-3 text-sm text-fg/50">Last updated: {EFFECTIVE_DATE}</p>

        <div className="mt-6 space-y-6 rounded-2xl border border-fg/8 bg-surface p-8 text-sm leading-relaxed text-fg/65 shadow-card">
          <p>
            These Terms of Agreement (&ldquo;Terms&rdquo;) govern your use of the Deltra Logistics
            package-forwarding service (the &ldquo;Service&rdquo;), operated by {COMPANY_LEGAL_NAME}
            {" "}(&ldquo;Deltra Logistics,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;), a company registered in{" "}
            {COMPANY_JURISDICTION}. By creating an account or using the Service, you agree to these
            Terms. If you do not agree, do not use the Service.
          </p>

          <section>
            <h2 className="text-base font-bold text-fg">1. The Service</h2>
            <p className="mt-2">
              Deltra Logistics assigns you a US shipping address. You use that address to receive
              packages purchased from US retailers. We receive, log, consolidate, and ship those
              packages to Jamaica by air or ocean freight, and make them available for collection
              or delivery from one of our branches. We are a freight forwarder, not the retailer,
              manufacturer, or carrier of the underlying goods.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">2. Your Account</h2>
            <p className="mt-2">
              You must provide accurate registration information and keep it up to date. You are
              responsible for all activity under your account and for keeping your password
              confidential. You must be at least 18 years old, or the age of majority in your
              jurisdiction, to create an account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">3. Prohibited and Restricted Items</h2>
            <p className="mt-2">
              You may not ship items that are illegal to import into Jamaica, hazardous materials,
              firearms or ammunition, counterfeit goods, or any item restricted or prohibited under
              Jamaica Customs Agency regulations or applicable international carrier rules. We may
              refuse, hold, or return any shipment that we reasonably believe violates this section,
              and we are not liable for delays or losses resulting from such action.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">4. Customs, Duties, and Invoices</h2>
            <p className="mt-2">
              You are responsible for providing accurate purchase invoices when requested and for
              any customs duties, taxes, or fees assessed by Jamaican customs authorities on your
              shipments. Providing false or misleading customs information may result in account
              suspension and is your sole legal responsibility.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">5. Fees and Payment</h2>
            <p className="mt-2">
              Shipping fees are calculated per pound at the rate displayed in your dashboard at the
              time of shipment, plus any applicable customs duties, handling fees, or additional
              charges disclosed before you are billed. Fees may be paid from your Deltra Logistics
              wallet balance or in cash at a branch, as offered in your account. Wallet top-ups and
              refunds are final once processed, except where required otherwise by law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">6. Package Retention and Disposal</h2>
            <p className="mt-2">
              Packages not collected within [retention period, e.g. 30 days] of arriving at your
              branch may be subject to storage fees or, after reasonable notice to you, disposed of
              or donated at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">7. Limitation of Liability</h2>
            <p className="mt-2">
              To the maximum extent permitted by {GOVERNING_LAW}, Deltra Logistics&rsquo; total
              liability for any lost, damaged, or delayed shipment is limited to the lesser of the
              declared value on the purchase invoice or [liability cap, e.g. a fixed amount per
              pound]. We are not liable for indirect, incidental, or consequential damages, or for
              delays caused by customs authorities, carriers, weather, or events outside our
              reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">8. Termination</h2>
            <p className="mt-2">
              We may suspend or terminate your account for violation of these Terms, fraudulent
              activity, or non-payment. You may close your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">9. Changes to These Terms</h2>
            <p className="mt-2">
              We may update these Terms from time to time. Continued use of the Service after an
              update constitutes acceptance of the revised Terms. Material changes will be
              communicated through the dashboard or by email.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">10. Governing Law</h2>
            <p className="mt-2">
              These Terms are governed by the laws of {GOVERNING_LAW}, without regard to conflict of
              law principles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-fg">11. Contact</h2>
            <p className="mt-2">
              Questions about these Terms can be sent to{" "}
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
