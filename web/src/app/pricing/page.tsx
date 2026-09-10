import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { PricingArticle } from "@/components/landing/PricingArticle";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
import { PLAN_FREE, PLAN_PAID, PRICING_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Pricing — ${SITE_NAME}`,
  description: `${SITE_NAME}: ${PLAN_FREE.name} ${PLAN_FREE.priceLabel}, ${PLAN_PAID.name} ${PLAN_PAID.priceLabel}/mo for the agentic coding harness. Checkout via Razorpay.`,
  alternates: { canonical: PRICING_URL },
  openGraph: {
    title: `Pricing — ${SITE_NAME}`,
    description: `${PLAN_FREE.name} ${PLAN_FREE.priceLabel} · ${PLAN_PAID.name} ${PLAN_PAID.priceLabel}/mo. Via Razorpay.`,
    url: PRICING_URL,
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <SkyPageShell>
      <Header />
      <main className="sky-scroll relative z-10">
        <PricingArticle />
      </main>
      <Footer />
    </SkyPageShell>
  );
}
