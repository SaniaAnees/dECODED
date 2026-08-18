import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { CostDemo } from "@/components/landing/CostDemo";
import { ComparisonCards } from "@/components/landing/ComparisonCards";
import { FeatureBlocks } from "@/components/landing/FeatureBlocks";
import { Footer } from "@/components/landing/Footer";
import { StickyCta } from "@/components/landing/StickyCta";

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <Header />
      <main className="pb-24 md:pb-8">
        <Hero />
        <CostDemo />
        <ComparisonCards />
        <FeatureBlocks />
      </main>
      <Footer />
      <StickyCta />
    </div>
  );
}
