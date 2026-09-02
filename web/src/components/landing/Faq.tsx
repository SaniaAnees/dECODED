"use client";

import { useState } from "react";

const items = [
  {
    q: "What is dECODED today?",
    a: "A local prefix-cache proxy and a normalizer. It is the first layer of a coding agent we are building to spend fewer tokens. It is not that agent yet.",
  },
  {
    q: "What are you building next?",
    a: "An agentic harness — a coding agent designed around token cost. We will start from an existing harness rather than pretend we already wrote one.",
  },
  {
    q: "Does my code leave my machine?",
    a: "The daemon runs on your machine. API keys and repo context are not sent to dECODED servers. There is no hosted hop. Requests go local proxy → provider.",
  },
  {
    q: "Will this cut my bill by a set percent?",
    a: "We will not print a savings number we have not measured with you. Provider cache-read rates are cheaper than uncached input when a prefix actually hits. That is the mechanism. The rest depends on the session.",
  },
  {
    q: "Do I need a domain or an account?",
    a: "No. Join the list with an email. The proxy, when you run it, lives on localhost.",
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="scroll-mt-24 mx-auto max-w-5xl px-6 py-8 md:px-8">
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
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-start justify-between gap-6 py-6 text-left"
                >
                  <span className="font-serif text-lg text-moon md:text-xl">
                    {item.q}
                  </span>
                  <span className="mt-1 font-mono text-[11px] text-dusk">
                    {isOpen ? "—" : "+"}
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
