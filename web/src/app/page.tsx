import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
import { Season } from "@/components/landing/Season";
import { Machine } from "@/components/landing/Machine";
import { NextSeason } from "@/components/landing/NextSeason";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <SkyPageShell>
      <Header />
      <main className="sky-scroll relative z-10">
        <Hero />
        <Season />
        <Machine />
        <NextSeason />
        <Faq />
      </main>
      <Footer />
    </SkyPageShell>
  );
}
