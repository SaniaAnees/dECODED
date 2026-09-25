const items = [
  {
    q: "Why was UseCoded started?",
    a: "By building the underlying infrastructure first and learning where repeated context and drifting request structure were costing real time and money. That work became the foundation for the harness.",
  },
  {
    q: "Who is UseCoded for?",
    a: "Developers and engineering teams running AI coding agents, plus solo builders who care about efficiency. Students and hackathon teams are part of the direction.",
  },
  {
    q: "Does UseCoded replace my coding agent?",
    a: "No. It is the layer around the workflow you already run, so you keep your agent and your provider key.",
  },
  {
    q: "How does UseCoded approach context and token efficiency?",
    a: "It treats repeated context and request structure as first-class problems, so the parts that repeat stay stable and can be reused. The target is unnecessary repeated context, not a fixed percentage.",
  },
  {
    q: "What is a personalized harness?",
    a: "A harness shaped around a specific person, environment, or workflow instead of one fixed setup. It is current capability, not a future idea.",
  },
  {
    q: "What is the Hackathon Harness?",
    a: "The first specialized harness, shaped around hackathon teams and their environment. It is being shipped, not a public adoption claim.",
  },
  {
    q: "Where does UseCoded run?",
    a: "The current implementation runs locally and uses your machine as the execution boundary.",
  },
];

export function AboutFaq() {
  return (
    <section
      id="faq"
      className="mx-auto max-w-5xl scroll-mt-[4.5rem] border-t border-line px-6 py-16 md:px-8 md:py-24"
    >
      <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">FAQ</p>
      <h2 className="mt-5 font-serif text-4xl font-medium leading-tight text-moon md:text-5xl">
        Frequently asked questions
      </h2>
      <div className="mt-12 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
              <span className="font-serif text-lg text-moon md:text-xl">
                {item.q}
              </span>
              <span
                aria-hidden
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gilt/50 font-mono text-[15px] leading-none text-gilt"
              >
                <span className="group-open:hidden">+</span>
                <span className="hidden group-open:inline">−</span>
              </span>
            </summary>
            <p className="max-w-2xl pb-6 font-serif text-[16px] leading-relaxed text-mist">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
