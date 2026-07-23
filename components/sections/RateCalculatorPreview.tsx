import RateCalculator from "@/components/dashboard/RateCalculator";
import ScrollReveal from "@/components/ui/ScrollReveal";
import MagneticButton from "@/components/ui/MagneticButton";

export default function RateCalculatorPreview() {
  return (
    <section id="calculator" className="relative overflow-hidden bg-bg py-28 text-fg lg:py-36">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,46,46,0.14),transparent_50%)]"
      />
      <div className="relative mx-auto grid max-w-container grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20 lg:px-12">
        <ScrollReveal direction="left">
          <span className="gold-label">No Signup Required</span>
          <h2 className="mt-6 max-w-lg text-display-md font-extrabold text-fg">
            Know your cost before you buy
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-fg/65">
            One flat rate, shown up front: J$600 per pound. Enter a weight and get an instant
            estimate — the same math we use to bill every package.
          </p>
          <div className="mt-8">
            <MagneticButton
              href="/quote"
              cursorLabel="Quote"
              className="border border-fg/25 text-fg hover:border-accent hover:text-accent"
            >
              Get a Full Quote
            </MagneticButton>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right" delay={0.1}>
          <RateCalculator title="Try it now" />
        </ScrollReveal>
      </div>
    </section>
  );
}
