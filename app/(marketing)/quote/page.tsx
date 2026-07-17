import type { Metadata } from "next";
import RateCalculator from "@/components/dashboard/RateCalculator";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const metadata: Metadata = {
  title: "Get a Quote | Deltra Logistics",
  description: "Estimate your shipping cost instantly — J$600 per pound, Standard Air.",
};

export default function QuotePage() {
  return (
    <div className="relative overflow-hidden bg-bg py-28 text-fg lg:py-36">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,46,46,0.18),transparent_55%)]" />
      <div className="relative mx-auto max-w-container px-6 lg:px-12">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <span className="gold-label justify-center">Get a Quote</span>
          <h1 className="mt-6 text-display-lg font-extrabold text-fg">
            Know your shipping cost before you buy
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-fg/65">
            Enter your package weight for an instant estimate — the same rate our warehouse
            uses to bill every shipment.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.15} className="mx-auto mt-14 max-w-xl">
          <RateCalculator />
        </ScrollReveal>
      </div>
    </div>
  );
}
