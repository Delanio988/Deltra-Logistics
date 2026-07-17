import { BENTO_FEATURES, type BentoFeature } from "@/lib/data";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

function BentoIcon({ icon, className }: { icon: BentoFeature["icon"]; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 40 40",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (icon) {
    case "bolt":
      return (
        <svg {...common}>
          <path d="M22 4 8 22h9l-3 14 16-20h-9z" strokeLinejoin="round" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M6 6h13l15 15-15 15L4 21V6z" strokeLinejoin="round" />
          <circle cx="14" cy="14" r="2.5" />
        </svg>
      );
    case "radar":
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="15" />
          <circle cx="20" cy="20" r="8" />
          <circle cx="20" cy="20" r="1.5" fill="currentColor" />
          <path d="M20 20 30 10" />
        </svg>
      );
    case "branch":
      return (
        <svg {...common}>
          <path d="M20 4c-6 5-9 10-9 15a9 9 0 0 0 18 0c0-5-3-10-9-15z" />
          <path d="M20 24v12" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="15" />
          <path d="M5 20h30M20 5c4 4 6 9 6 15s-2 11-6 15c-4-4-6-9-6-15s2-11 6-15z" />
        </svg>
      );
    default:
      return null;
  }
}

const SIZE_CLASSES: Record<BentoFeature["size"], string> = {
  lg: "lg:col-span-4 lg:row-span-2",
  md: "lg:col-span-2",
  sm: "lg:col-span-3",
};

function BentoCard({ feature, index }: { feature: BentoFeature; index: number }) {
  const isLarge = feature.size === "lg";
  return (
    <ScrollReveal
      as="li"
      index={index}
      direction="up"
      distance={24}
      className={cn("h-full", SIZE_CLASSES[feature.size])}
    >
      <article
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-navy-950/8 bg-white p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-card",
          isLarge && "justify-center p-10"
        )}
      >
        <div
          aria-hidden
          className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/0 blur-2xl transition-colors duration-500 group-hover:bg-accent/25"
        />
        <BentoIcon
          icon={feature.icon}
          className={cn(
            "relative text-accent transition-colors duration-500 group-hover:text-gold",
            isLarge ? "h-14 w-14" : "h-10 w-10"
          )}
        />
        <h3 className={cn("relative mt-6 font-bold text-navy-950", isLarge ? "text-2xl" : "text-xl")}>
          {feature.title}
        </h3>
        <p className="relative mt-3 max-w-md text-[15px] leading-relaxed text-navy-950/65">
          {feature.description}
        </p>
        <span className="relative mt-6 block h-px w-10 bg-gold/60 transition-all duration-500 group-hover:w-16" />
      </article>
    </ScrollReveal>
  );
}

export default function FeatureBento() {
  return (
    <section id="about" className="bg-white py-28 lg:py-36">
      <div className="mx-auto max-w-container px-6 lg:px-12">
        <ScrollReveal>
          <span className="gold-label">Why Deltra</span>
          <h2 className="mt-6 max-w-2xl text-display-md font-extrabold text-navy-950">
            Built for how you actually shop
          </h2>
        </ScrollReveal>

        <ul className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-6 lg:grid-rows-2">
          {BENTO_FEATURES.map((feature, i) => (
            <BentoCard key={feature.id} feature={feature} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}
