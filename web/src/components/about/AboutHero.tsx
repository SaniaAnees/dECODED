/**
 * Top of the About page. A clean dark surface, no sky and no plane: the company
 * statement and the one-line definition. The architecture is explained by the
 * product section below, so it is not repeated here.
 */
export function AboutHero() {
  return (
    <section className="relative bg-[#0a1228]">
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-10 md:px-8 md:pb-24 md:pt-16">
        <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
          ABOUT USECODED
        </p>
        <h1 className="mt-5 max-w-3xl font-serif text-[2.1rem] font-medium leading-[1.1] text-[#f7f1e6] sm:text-[2.6rem] md:text-[3.1rem]">
          Build at the edge of technology.
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-[1.05rem] leading-relaxed text-[#f7f1e6]/80">
          UseCoded is an AI coding harness.
        </p>
        <p className="mt-5 font-mono text-[11px] tracking-[0.14em] text-dusk">
          Coding · Hackathons · Personalized workflows
        </p>
      </div>
    </section>
  );
}
