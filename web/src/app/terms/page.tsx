import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
import { TermsArticle } from "@/components/landing/TermsArticle";
import { SITE_NAME, TERMS_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms — ${SITE_NAME}`,
  description:
    "Terms for usecoded: closed-source token-optimization CLI. Free $0, Pro $10/month via Razorpay.",
  alternates: { canonical: TERMS_URL },
  openGraph: {
    title: `Terms — ${SITE_NAME}`,
    description:
      "Pro $10/month unlocks the usecoded CLI harness. Checkout via Razorpay.",
    url: TERMS_URL,
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <SkyPageShell>
      <Header />
      <main className="sky-scroll relative z-10">
        <TermsArticle />
      </main>
      <Footer />
    </SkyPageShell>
  );
}
