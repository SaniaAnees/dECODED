"use client";

import { useState } from "react";

const items = [
  {
    q: "Why was our cache hit rate stuck at zero?",
    a: "The agent kept reordering tool definitions and drifting the system prompt — whitespace, key order, extra fields. Prefix cache only hits when those bytes stay identical turn to turn. We spent weeks on golden tests for the normalizer before /stats moved.",
  },
  {
    q: "Do I actually need two terminals?",
    a: "Yes. One process runs decoded start with DECODED_* upstream URLs — that talks to the lab. A second shell points the agent at localhost with OPENAI_BASE_URL or ANTHROPIC_BASE_URL. Mix them up and traffic skips the proxy entirely.",
  },
  {
    q: "Mistral shows cache hits. Why did Claude sometimes show cached=0?",
    a: "We measured cached_tokens reliably on Mistral first. Other labs may not expose the field in usage JSON even when the body is clean. We will not quote a savings percent from a counter we cannot read.",
  },
  {
    q: "What broke when we first put Claude Code behind the proxy?",
    a: "Stray cache_control on the wrong API shape. Gateways that looked like Anthropic but routed OpenAI JSON. Normalize failures that would have forwarded dirty bodies — we fail closed on those now instead of pass-through.",
  },
  {
    q: "Will this help if the agent rewrites the system prompt every turn?",
    a: "No. That is the waste we are trying to stop. The proxy keeps the prefix stable when the harness does not fight it. If your agent rewrites context each turn, fix the harness — we cannot cache what never repeats.",
  },
  {
    q: "Is this a coding agent yet?",
    a: "No. What shipped is the localhost proxy and normalizer — the layer we needed before an agent could spend less on repeated context. The harness is next season, not this page.",
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
