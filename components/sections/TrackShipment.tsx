import Link from "next/link";
import { EXAMPLE_TRACKING_STEPS } from "@/lib/data";
import ScrollReveal from "@/components/ui/ScrollReveal";
import MagneticButton from "@/components/ui/MagneticButton";
import StatusTimeline from "@/components/ui/StatusTimeline";

export default function TrackShipment() {
  return (
    <section id="tracking" className="bg-offwhite py-28 lg:py-36">
      <div className="mx-auto max-w-container px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-20">
          <ScrollReveal direction="left">
            <span className="gold-label">Track Your Shipment</span>
            <h2 className="mt-6 text-display-md font-extrabold text-navy-950">
              Know exactly where it is
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-navy-950/65">
              Every package is logged the moment it hits our US warehouse and tracked all the way
              to your branch. Sign in to your dashboard to see the real-time status of your own
              shipments.
            </p>

            <div className="mt-8">
              <MagneticButton
                href="/login"
                cursorLabel="Sign in"
                strength={0.2}
                className="bg-navy-950 text-white hover:bg-accent"
              >
                Sign In to Track
              </MagneticButton>
            </div>
          </ScrollReveal>

          <div className="rounded-3xl border border-navy-950/8 bg-white p-8 shadow-card lg:p-12">
            <p className="text-sm font-medium text-navy-950/50">Example status timeline</p>
            <StatusTimeline steps={EXAMPLE_TRACKING_STEPS} currentStepIndex={2} className="mt-8" />
            <p className="mt-4 text-xs text-navy-950/40">
              Illustrative example —{" "}
              <Link href="/login" className="font-medium text-accent hover:text-accent-dark">
                sign in
              </Link>{" "}
              to see your own shipments.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
