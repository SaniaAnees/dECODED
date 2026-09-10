"use client";

import { useState } from "react";

const items = [
  {
    q: "Why was our cache hit rate stuck at zero?",
    a: "The agent kept reordering tool definitions and drifting the system prompt — whitespace, key order, extra fields. Prefix cache only hits when those bytes stay identical turn to turn. We spent weeks on golden tests for the normalizer before /stats moved.",
  },
  {
    q: "What is usecoded actually shipping today?",
    a: "A built agentic harness optimized for token economics: local request normalization, localhost routing, and cache-aware forwarding to your provider. The point is to reduce repeated context spend without introducing a hosted trust hop.",
  },
  {
    q: "Do I actually need two terminals?",
    a: "Usually yes. One process runs usecoded on localhost. A second shell runs the agent and points it at localhost with your provider base URL env vars. Mix those roles up and traffic can skip the harness entirely.",
  },
  {
    q: "Why does the proof demo emphasize Mistral?",
    a: "Because Mistral is the path where we measured cached_tokens cleanly in usage JSON. Other providers may still return cached=0 even when the request body is stable, so we refuse to market a savings percentage we cannot verify.",
  },
  {
    q: "What broke when this first went behind real coding agents?",
    a: "Stray cache_control on the wrong API shape, gateways that looked like Anthropic but routed OpenAI JSON, and normalize failures that would have forwarded dirty bodies. Those are exactly the reasons the harness now fails closed instead of pretending everything is fine.",
  },
  {
    q: "Will this help if my agent rewrites the system prompt every turn?",
    a: "Only up to a point. usecoded can preserve stable structure, but it cannot manufacture a cache hit from context that never repeats. If your harness churns the prefix every turn, that harness still needs fixing.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <hr className="rule" />
      <div className="py-24 md:py-32">
        <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
          INQUIRIES
        </p>
        <h2 className="mt-5 font-serif text-4xl font-medium text-moon md:text-5xl">
          Fair questions.
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
                {isOpen && (
                  <p className="max-w-2xl pb-6 font-serif text-[17px] leading-relaxed text-mist">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
