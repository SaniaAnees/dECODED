import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { PrivacyArticle } from "@/components/landing/PrivacyArticle";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
import { PRIVACY_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy — ${SITE_NAME}`,
  description:
    "How uncoded handles waitlist email, Google sign-in, and local API keys.",
  alternates: { canonical: PRIVACY_URL },
  openGraph: {
    title: `Privacy — ${SITE_NAME}`,
    description:
      "Waitlist email, Google sign-in, and keys that stay on your machine.",
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
