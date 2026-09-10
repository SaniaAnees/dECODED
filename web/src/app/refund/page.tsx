import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { RefundArticle } from "@/components/landing/RefundArticle";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
import { REFUND_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Refund — ${SITE_NAME}`,
  description:
    "Cancel vs refund for usecoded: cancel anytime; 14-day little-or-no-use refunds via Razorpay.",
  alternates: { canonical: REFUND_URL },
  openGraph: {
    title: `Refund — ${SITE_NAME}`,
    description:
      "Cancel anytime. 14-day little-or-no-use refund window. Refunds via Razorpay in 5–10 business days.",
    url: REFUND_URL,
    type: "website",
  },
};

export default function RefundPage() {
  return (
    <SkyPageShell>
      <Header />
      <main className="sky-scroll relative z-10">
        <RefundArticle />
      </main>
      <Footer />
    </SkyPageShell>
  );
}
