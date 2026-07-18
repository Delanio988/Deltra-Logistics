import Hero from "@/components/sections/Hero";
import RateCalculatorPreview from "@/components/sections/RateCalculatorPreview";
import FloatingRetailers from "@/components/sections/FloatingRetailers";
import Services from "@/components/sections/Services";
import FeatureBento from "@/components/sections/FeatureBento";
import TrackShipment from "@/components/sections/TrackShipment";
import Process from "@/components/sections/Process";

export default function Home() {
  return (
    <>
      <Hero />
      <RateCalculatorPreview />
      <FloatingRetailers />
      <Services />
      <FeatureBento />
      <TrackShipment />
      <Process />
    </>
  );
}
