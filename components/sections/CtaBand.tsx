import ScrollReveal from "@/components/ui/ScrollReveal";
import MagneticButton from "@/components/ui/MagneticButton";

export default function CtaBand() {
  return (
    <section id="contact" className="relative overflow-hidden bg-navy-950 py-28 text-white lg:py-32">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(212,175,55,0.18),transparent_60%)]" />
      <div className="relative mx-auto max-w-container px-6 text-center lg:px-12">
        <ScrollReveal>
          <span className="gold-label justify-center">Get Started</span>
          <h2 className="mx-auto mt-6 max-w-3xl text-display-lg font-extrabold text-white">
            Ready to ship smarter?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-white/65">
            Tell us about your freight and we&rsquo;ll build a route, timeline, and quote —
            usually within one business day.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
            <MagneticButton
              href="mailto:quotes@meridianfreight.com"
              cursorLabel="Quote"
              className="bg-gold text-navy-950 shadow-gold hover:bg-gold-light"
            >
              Get a Quote
            </MagneticButton>
            <MagneticButton
              href="tel:+18005551234"
              cursorLabel="Call"
              className="border border-white/25 text-white hover:border-gold hover:text-gold"
            >
              Talk to Our Team
            </MagneticButton>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
