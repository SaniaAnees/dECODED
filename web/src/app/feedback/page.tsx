import type { Metadata } from "next";
import { FeedbackForm } from "@/components/landing/FeedbackForm";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
import { FEEDBACK_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Feedback — ${SITE_NAME}`,
  description: "Bug, idea, or billing issue — send it here.",
  alternates: { canonical: FEEDBACK_URL },
  openGraph: {
    title: `Feedback — ${SITE_NAME}`,
    description: "Bug, idea, or billing issue — send it here.",
    url: FEEDBACK_URL,
    type: "website",
  },
};

export default function FeedbackPage() {
  return (
    <SkyPageShell>
      <Header />
      <main className="sky-scroll relative z-10">
        <div className="mx-auto max-w-2xl px-6 py-16 md:px-8 md:py-24">
          <article className="legal-doc rounded-[1.25rem] px-7 py-10 sm:px-9 sm:py-11 md:px-11 md:py-12">
            <header className="border-b border-line pb-8">
              <h1 className="font-serif text-4xl font-medium leading-tight tracking-tight text-moon md:text-[2.75rem]">
                Feedback
              </h1>
              <p className="mt-5 max-w-lg font-serif text-lg leading-relaxed text-mist">
                Bug, idea, or billing issue — send it here. I’ll read it.
              </p>
            </header>
            <div className="pt-9">
              <FeedbackForm />
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </SkyPageShell>
  );
}
