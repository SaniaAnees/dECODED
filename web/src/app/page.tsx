import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Season } from "@/components/landing/Season";
import { Machine } from "@/components/landing/Machine";
import { NextSeason } from "@/components/landing/NextSeason";
import { Ledger } from "@/components/landing/Ledger";
import { Faq } from "@/components/landing/Faq";
import { Waitlist } from "@/components/landing/Waitlist";
import { Footer } from "@/components/landing/Footer";
import { StickyCta } from "@/components/landing/StickyCta";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <Header />
      <main>
        <Hero />
        <Season />
        <Machine />
        <NextSeason />
        <Ledger />
        <Faq />
        <Waitlist />
      </main>
      <Footer />
      <StickyCta />
    </div>
  );
}
