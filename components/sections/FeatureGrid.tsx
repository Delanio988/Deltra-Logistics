import { FEATURE_GRID_ITEMS, type FeatureGridItem } from "@/lib/data";
import FeatureGridIcon from "@/components/ui/FeatureGridIcon";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

// This section is a fixed-dark band (like Process.tsx is fixed-light) —
// deliberately NOT theme-aware, so every color here uses the fixed white/
// navy/accent tokens, never text-fg/bg-surface (which would flip to
// near-black text on a light background in light mode and vanish).
function FeatureCard({ feature, index }: { feature: FeatureGridItem; index: number }) {
  const isHighlight = feature.highlight;

  return (
    <ScrollReveal as="li" index={index} direction="up" distance={24} className="h-full">
      <article
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl border p-8 transition-all duration-500 hover:-translate-y-2",
          isHighlight
            ? "border-accent bg-accent text-navy-950 shadow-accent"
            : "border-white/10 bg-white/[0.03] text-white hover:border-accent/50 hover:shadow-accent"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-2 -top-6 text-[6.5rem] font-extrabold leading-none transition-colors duration-500 lg:text-[8rem]",
            isHighlight ? "text-navy-950/15 group-hover:text-navy-950/25" : "text-white/5 group-hover:text-white/10"
          )}
        >
          {feature.number}
        </span>

        <FeatureGridIcon
          icon={feature.icon}
          className={cn("relative h-10 w-10", isHighlight ? "text-navy-950" : "text-accent")}
        />
        <h3 className="relative mt-6 text-xl font-bold">{feature.title}</h3>
        <p className={cn("relative mt-3 text-[15px] leading-relaxed", isHighlight ? "text-navy-950/75" : "text-white/60")}>
          {feature.description}
        </p>
        <span
          className={cn(
            "relative mt-6 block h-px w-10 transition-all duration-500 group-hover:w-16",
            isHighlight ? "bg-navy-950/40" : "bg-gold/60"
          )}
        />
      </article>
    </ScrollReveal>
  );
}

export default function FeatureGrid() {
  return (
    <section id="about" className="relative overflow-hidden bg-navy-950 py-28 lg:py-36">
      <div aria-hidden className="absolute right-0 top-0 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-[120px]" />

      <div className="relative mx-auto max-w-container px-6 lg:px-12">
        <ScrollReveal>
          <span className="gold-label">Why Deltra</span>
          <h2 className="mt-6 max-w-2xl text-display-md font-extrabold text-white">
            Six reasons shipping with us just works.
          </h2>
        </ScrollReveal>

        <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_GRID_ITEMS.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}
