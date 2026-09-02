const notes = [
  {
    title: "Localhost",
    body: "The proxy listens on your machine. Prompts are not stored on a dECODED server. There is no hosted hop.",
  },
  {
    title: "Your keys",
    body: "Provider credentials never leave the laptop. The daemon forwards with the header you already use.",
  },
  {
    title: "Shape, not hostname",
    body: "Requests are typed from JSON shape — Anthropic or OpenAI — so a gateway host cannot fool the route.",
  },
];

export function Machine() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-8 md:px-8">
      <hr className="rule" />
      <div className="py-24 md:py-32">
        <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
          ON THE MACHINE
        </p>
        <h2 className="mt-5 max-w-xl font-serif text-4xl font-medium leading-tight text-moon md:text-5xl">
          Nothing here requires trust in a cloud we do not run.
        </h2>
        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {notes.map((note) => (
            <article key={note.title}>
              <h3 className="font-serif text-xl italic text-moon">{note.title}</h3>
              <p className="mt-3 font-serif text-[17px] leading-relaxed text-mist">
                {note.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
