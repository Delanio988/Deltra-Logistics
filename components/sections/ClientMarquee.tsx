import { CLIENT_MARQUEE } from "@/lib/data";
import Marquee from "@/components/ui/Marquee";

// TODO: swap plain wordmarks for real client logo SVGs when available.
export default function ClientMarquee() {
  return (
    <section aria-label="Trusted by" className="border-y border-navy-950/8 bg-white py-10">
      <Marquee
        items={CLIENT_MARQUEE}
        renderItem={(name) => (
          <span className="text-lg font-semibold uppercase tracking-wide text-navy-950/35">{name}</span>
        )}
        duration={38}
      />
    </section>
  );
}
