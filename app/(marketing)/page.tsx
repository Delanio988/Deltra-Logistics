import Hero from "@/components/sections/Hero";
import StatsBar from "@/components/sections/StatsBar";
import ClientMarquee from "@/components/sections/ClientMarquee";
import Services from "@/components/sections/Services";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import GlobalNetwork from "@/components/sections/GlobalNetwork";
import TrackShipment from "@/components/sections/TrackShipment";
import Process from "@/components/sections/Process";
import Testimonials from "@/components/sections/Testimonials";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <ClientMarquee />
      <Services />
      <WhyChooseUs />
      <GlobalNetwork />
      <TrackShipment />
      <Process />
      <Testimonials />
    </>
  );
}
