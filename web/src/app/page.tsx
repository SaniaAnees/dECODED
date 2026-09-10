import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HashScroll } from "@/components/landing/ScrollLink";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
import { Season } from "@/components/landing/Season";
import { Machine } from "@/components/landing/Machine";
import { Faq } from "@/components/landing/Faq";
import { Waitlist } from "@/components/landing/Waitlist";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <SkyPageShell>
      <HashScroll />
      <Header />
      <main className="sky-scroll relative z-10">
        <Hero />
        <Season />
        <Machine />
        <Faq />
        <Waitlist />
      </main>
      <Footer />
    </SkyPageShell>
  );
}
