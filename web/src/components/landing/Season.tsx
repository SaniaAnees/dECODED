const entries = [
  {
    mark: "I",
    title: "The normalizer",
    body: "It keeps system prompts and tool lists byte-exact from one turn to the next. Cache only hits when the prefix does not drift.",
  },
  {
    mark: "II",
    title: "The cache",
    body: "A localhost proxy sits in front of the provider API so a stable prefix can be reused. Keys and repo context stay on your machine.",
  },
];

export function Season() {
  return (
    <section id="now" className="scroll-mt-24 mx-auto max-w-5xl px-6 py-24 md:px-8 md:py-32">
      <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
        THIS SEASON
      </p>
      <h2 className="mt-5 max-w-2xl font-serif text-4xl font-medium leading-tight text-moon md:text-5xl">
        Two things we can stand behind.
      </h2>
      <p className="mt-5 max-w-xl font-serif text-lg leading-relaxed text-mist">
        Not a coding agent yet. Not a billed-savings guarantee. The work that
        exists is the layer underneath.
      </p>

      <div className="mt-16 grid gap-12 md:grid-cols-2 md:gap-16">
        {entries.map((entry) => (
          <article key={entry.mark} className="border-t border-line pt-8">
            <p className="font-mono text-[11px] tracking-[0.22em] text-gilt">
              {entry.mark}
            </p>
            <h3 className="mt-3 font-serif text-2xl italic text-moon">
              {entry.title}
            </h3>
            <p className="mt-4 font-serif text-[17px] leading-relaxed text-mist">
              {entry.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
