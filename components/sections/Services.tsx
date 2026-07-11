import { SERVICES } from "@/lib/data";
import ScrollReveal from "@/components/ui/ScrollReveal";
import ServiceIcon from "@/components/ui/ServiceIcon";

export default function Services() {
  return (
    <section id="services" className="bg-offwhite py-28 lg:py-36">
      <div className="mx-auto max-w-container px-6 lg:px-12">
        <ScrollReveal>
          <span className="gold-label">What We Do</span>
          <h2 className="mt-6 max-w-2xl text-display-md font-extrabold text-navy-950">
            End-to-end freight, handled by one team
          </h2>
        </ScrollReveal>

        <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <ScrollReveal as="li" key={service.id} index={i} direction="up" distance={24}>
              <article className="group relative h-full overflow-hidden rounded-2xl border border-navy-950/8 bg-white p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-card">
                <div
                  aria-hidden
                  className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent/0 blur-2xl transition-colors duration-500 group-hover:bg-accent/25"
                />
                <ServiceIcon
                  icon={service.icon}
                  className="relative h-10 w-10 text-accent transition-colors duration-500 group-hover:text-gold"
                />
                <h3 className="relative mt-6 text-xl font-bold text-navy-950">{service.title}</h3>
                <p className="relative mt-3 text-[15px] leading-relaxed text-navy-950/65">
                  {service.description}
                </p>
                <span className="relative mt-6 block h-px w-10 bg-gold/60 transition-all duration-500 group-hover:w-16" />
              </article>
            </ScrollReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
