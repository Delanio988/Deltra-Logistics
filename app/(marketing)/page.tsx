import Hero from "@/components/sections/Hero";
import FloatingRetailers from "@/components/sections/FloatingRetailers";
import Services from "@/components/sections/Services";
import FeatureGrid from "@/components/sections/FeatureGrid";
import BrandStatement from "@/components/sections/BrandStatement";
import Process from "@/components/sections/Process";

export default function Home() {
  return (
    <>
      <Hero />
      <FloatingRetailers />
      <Services />
      <FeatureGrid />
      <BrandStatement />
      <Process />
    </>
  );
}
