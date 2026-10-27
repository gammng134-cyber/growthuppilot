import { Faq, FinalCta, Footer } from "@/components/landing/faq";
import { Hero } from "@/components/landing/hero";
import { Nav } from "@/components/landing/nav";
import {
  AgentSwitches,
  Atmospherics,
  HowItWorks,
  Showcase,
} from "@/components/landing/sections";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <AgentSwitches />
      <Showcase />
      <HowItWorks />
      <Atmospherics />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
