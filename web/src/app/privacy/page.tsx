import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { PrivacyArticle } from "@/components/landing/PrivacyArticle";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
import { PRIVACY_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy — ${SITE_NAME}`,
  description:
    "What usecoded collects for accounts, waitlist, and Razorpay Pro billing — and what we do not.",
  alternates: { canonical: PRIVACY_URL },
  openGraph: {
    title: `Privacy — ${SITE_NAME}`,
    description:
      "Accounts, waitlist, Razorpay for Pro. We do not collect your repo through the website.",
    url: PRIVACY_URL,
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <SkyPageShell>
      <Header />
      <main className="sky-scroll relative z-10">
        <PrivacyArticle />
      </main>
      <Footer />
    </SkyPageShell>
  );
}
