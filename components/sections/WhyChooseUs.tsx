import Image from "next/image";
import { FEATURES } from "@/lib/data";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

export default function WhyChooseUs() {
  return (
    <section id="about" className="bg-white py-28 lg:py-36">
      <div className="mx-auto max-w-container px-6 lg:px-12">
        <ScrollReveal>
          <span className="gold-label">Why Choose Us</span>
          <h2 className="mt-6 max-w-2xl text-display-md font-extrabold text-navy-950">
            Reliability that scales with you
          </h2>
        </ScrollReveal>

        <div className="mt-20 flex flex-col gap-24 lg:gap-32">
          {FEATURES.map((feature, i) => {
            const reversed = i % 2 === 1;
            return (
              <div
                key={feature.number}
                className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20"
              >
                <ScrollReveal
                  direction={reversed ? "right" : "left"}
                  className={cn("relative", reversed && "lg:order-2")}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card">
                    <Image
                      src={feature.image}
                      alt={`Illustration representing: ${feature.title}`}
                      fill
                      sizes="(min-width: 1024px) 40vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                </ScrollReveal>

                <ScrollReveal
                  direction={reversed ? "left" : "right"}
                  className={cn(reversed && "lg:order-1")}
                >
                  <span className="text-5xl font-extrabold text-gold/30">{feature.number}</span>
                  <h3 className="mt-4 text-display-sm font-bold text-navy-950">{feature.title}</h3>
                  <p className="mt-5 max-w-md text-[15px] leading-relaxed text-navy-950/65">
                    {feature.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {["Dedicated account management", "Real-time exception alerts", "Transparent, all-in pricing"].map(
                      (item) => (
                        <li key={item} className="flex items-center gap-3 text-sm font-medium text-navy-950/80">
                          <svg
                            aria-hidden
                            viewBox="0 0 20 20"
                            className="h-5 w-5 shrink-0 text-gold"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M4 10.5 8 14l8-8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </ScrollReveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
