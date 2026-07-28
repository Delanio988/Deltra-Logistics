import ScrollReveal from "@/components/ui/ScrollReveal";

/** Small diagonal dot-and-line echo of Process.tsx's route-line motif, used
 *  here as a low-opacity ambient watermark rather than a real connector —
 *  kept local (not extracted from Process.tsx) since that component's
 *  RouteLine() is tightly coupled to its own step-card width math. */
function RouteMotif() {
  return (
    <svg aria-hidden viewBox="0 0 400 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <path
        d="M0,160 C100,140 150,60 260,40 C320,28 360,30 400,10"
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.12}
        strokeWidth={1.5}
        strokeDasharray="2 12"
      />
      <circle cx="0" cy="160" r="5" fill="currentColor" opacity={0.15} />
      <circle cx="260" cy="40" r="4" fill="currentColor" opacity={0.15} />
      <circle cx="400" cy="10" r="5" fill="currentColor" opacity={0.15} />
    </svg>
  );
}

export default function BrandStatement() {
  return (
    <section className="relative overflow-hidden bg-brand-gradient py-28 text-navy-950 lg:py-40">
      <div aria-hidden className="absolute inset-0 opacity-60">
        <RouteMotif />
      </div>

      <div className="relative mx-auto max-w-container px-6 lg:px-12">
        <ScrollReveal>
          <span className="text-xs font-semibold uppercase tracking-widest2 text-navy-950/60">Deltra Logistics</span>
          <h2 className="mt-6 text-display-2xl font-extrabold uppercase text-navy-950">
            Your US cart.
            <br />
            Our next flight home.
          </h2>
          <p className="mt-8 max-w-lg text-lg text-navy-950/70">
            US retail. Jamaica home. One flight away.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
