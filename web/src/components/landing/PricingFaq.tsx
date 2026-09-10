"use client";

import { useState } from "react";
import { CONTACT_EMAIL } from "@/lib/site";

const items = [
  {
    q: "What’s included in Free?",
    a: "CLI access with Auto and free models, and limited agent usage. No credit card required.",
  },
  {
    q: "What’s included in Pro?",
    a: "Everything in Free, plus extended limits, access to more models, and priority access to new features.",
  },
  {
    q: "How much is Pro?",
    a: "$10 per month, billed through Razorpay.",
  },
  {
    q: "Do Free and Pro get support?",
    a: (
      <>
        Yes. Email{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-gilt underline-offset-4 transition-colors hover:text-moon hover:underline"
        >
          {CONTACT_EMAIL}
        </a>{" "}
        on either plan.
      </>
    ),
  },
  {
    q: "Can I cancel?",
    a: "Yes. You keep Pro until the billing period ends, then you move to Free.",
  },
  {
    q: "I paid but I’m still on Free",
    a: (
      <>
        Refresh, then sign out and back in. If it stays Free after a few
        minutes, email us with your Razorpay payment id:{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-gilt underline-offset-4 transition-colors hover:text-moon hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        .
      </>
    ),
  },
];

export function PricingFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <hr className="rule" />
      <div className="py-24 md:py-32">
        <h2 className="font-serif text-4xl font-medium text-moon md:text-5xl">
          FAQ
        </h2>
        <div className="mt-12 divide-y divide-line border-y border-line">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start justify-between gap-6 py-6 text-left"
                >
                  <span className="font-serif text-lg text-moon md:text-xl">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gilt/50 font-mono text-[15px] leading-none text-gilt"
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen ? (
                  <p className="max-w-2xl pb-6 font-serif text-[17px] leading-relaxed text-mist">
                    {item.a}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
