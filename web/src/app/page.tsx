import { Header } from "@/components/landing/Header";
import {
  BetaAndTerminal,
  TerminalPreview,
} from "@/components/landing/BetaAndTerminal";
import { ComparisonCards } from "@/components/landing/ComparisonCards";
import { FeatureBlocks } from "@/components/landing/FeatureBlocks";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#e4e4e7]">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <section>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[#f9fafb] md:text-5xl md:leading-[1.12]">
            10x Faster Agents. 70% Cheaper API Bills. Zero Context Loss.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#9ca3af]">
            Stop agent context drift and maximize KV-cache hits with a 1-line
            setup.
          </p>

          <BetaAndTerminal />
          <TerminalPreview />
        </section>

        <ComparisonCards />
        <FeatureBlocks />
      </main>

      <Footer />
    </div>
  );
}
