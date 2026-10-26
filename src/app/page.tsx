import { Footer, Faq } from "@/components/landing/faq";
import { Hero } from "@/components/landing/hero";
import { Nav } from "@/components/landing/nav";
import {
  AgentDetails,
  AgentsSection,
  FinalCta,
  HowItWorks,
  Safety,
} from "@/components/landing/sections";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <AgentsSection />
      <AgentDetails />
      <HowItWorks />
      <Safety />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
