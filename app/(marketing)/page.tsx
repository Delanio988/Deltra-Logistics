import Hero from "@/components/sections/Hero";
import RateCalculatorPreview from "@/components/sections/RateCalculatorPreview";
import StatsBar from "@/components/sections/StatsBar";
import ClientMarquee from "@/components/sections/ClientMarquee";
import FloatingRetailers from "@/components/sections/FloatingRetailers";
import Services from "@/components/sections/Services";
import FeatureBento from "@/components/sections/FeatureBento";
import TrackShipment from "@/components/sections/TrackShipment";
import Process from "@/components/sections/Process";
import Testimonials from "@/components/sections/Testimonials";

export default function Home() {
  return (
    <>
      <Hero />
      <RateCalculatorPreview />
      <StatsBar />
      <ClientMarquee />
      <FloatingRetailers />
      <Services />
      <FeatureBento />
      <TrackShipment />
      <Process />
      <Testimonials />
    </>
  );
}
