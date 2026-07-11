import { STATS } from "@/lib/data";
import Counter from "@/components/ui/Counter";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function StatsBar() {
  return (
    <section id="stats" aria-label="Deltra Logistics by the numbers" className="bg-navy-950 py-20 text-white">
      <div className="mx-auto max-w-container px-6 lg:px-12">
        <dl className="grid grid-cols-2 gap-10 lg:grid-cols-4 lg:gap-6">
          {STATS.map((stat, i) => (
            <ScrollReveal key={stat.label} index={i} direction="up" className="text-center lg:text-left">
              <dd className="text-display-sm font-extrabold text-accent">
                <Counter value={stat.value} suffix={stat.suffix} decimals={"decimals" in stat ? stat.decimals : 0} />
              </dd>
              <dt className="mt-2 text-sm font-medium text-white/60">{stat.label}</dt>
            </ScrollReveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
