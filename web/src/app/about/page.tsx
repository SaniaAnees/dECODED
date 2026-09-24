import type { Metadata } from "next";
import { AboutArticle } from "@/components/about/AboutArticle";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
import { ABOUT_URL } from "@/lib/site";
import { buildAboutJsonLd } from "@/lib/structured-data";

const TITLE = "About UseCoded | AI Coding Harness Infrastructure";
const DESCRIPTION =
  "Learn what UseCoded is building around AI coding harnesses, context efficiency, personalized development workflows, and accessible AI development.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: ABOUT_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: ABOUT_URL,
    type: "website",
    images: [{ url: "/opengraph-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image.jpg"],
  },
};

export default function AboutPage() {
  const jsonLd = buildAboutJsonLd();

  return (
    <SkyPageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="sky-scroll relative z-10">
        <AboutArticle />
      </main>
      <Footer />
    </SkyPageShell>
  );
}
