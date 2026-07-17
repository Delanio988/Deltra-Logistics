import Image from "next/image";
import type { Retailer } from "@/lib/retailers";
import { cn } from "@/lib/utils";

type LogoTileProps = {
  retailer: Retailer;
  className?: string;
};

/**
 * Uniform card for a brand logo — any logo (or text fallback, see
 * lib/retailers.ts) reads on any background because the tile itself is a
 * consistent soft neutral surface, rather than relying on the logo's own
 * colors to work against whatever the page background happens to be.
 */
export default function LogoTile({ retailer, className }: LogoTileProps) {
  return (
    <div
      data-cursor-hover={retailer.name}
      className={cn(
        "group flex h-20 w-36 shrink-0 items-center justify-center rounded-2xl border border-fg/10 bg-fg/[0.04] p-4 shadow-card transition-all duration-300",
        "hover:-translate-y-1 hover:border-accent/30 hover:bg-fg/[0.06]",
        "dark:shadow-[0_0_16px_-4px_rgba(255,46,46,0.15)] dark:hover:shadow-[0_0_26px_-4px_rgba(255,46,46,0.3)]",
        className
      )}
    >
      {retailer.logo ? (
        <div className="relative h-full w-full">
          <Image src={retailer.logo} alt={`${retailer.name} logo`} fill sizes="144px" className="object-contain" />
        </div>
      ) : (
        // No clean SVG available for this brand yet — see public/brands/README.md.
        <span className="text-center text-lg font-extrabold tracking-tight text-fg/70 transition-colors group-hover:text-accent-text">
          {retailer.name}
        </span>
      )}
    </div>
  );
}
