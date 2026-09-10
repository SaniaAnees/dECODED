const notes = [
  {
    title: "Localhost",
    body: "The harness listens on your machine. Prompts are not stored on a usecoded server and there is no hosted hop to trust.",
  },
  {
    title: "Your keys",
    body: "Provider credentials stay on the laptop. usecoded forwards with the key header you already use instead of asking for an account relay.",
  },
  {
    title: "Shape, not hostname",
    body: "Requests are typed from JSON shape, not whatever hostname they arrived through, so a gateway cannot bluff the route by looking familiar.",
  },
];

export function Machine() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-8 md:px-8">
      <hr className="rule" />
      <div className="py-24 md:py-32">
        <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
          TRUST
        </p>
        <h2 className="mt-5 max-w-xl font-serif text-4xl font-medium leading-tight text-moon md:text-5xl">
          Localhost, keys, shape-not-hostname.
        </h2>
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-mist">
          The trust boundary is intentionally small: your harness runs locally,
          your provider key stays local, and routing decisions are based on the
          request shape the model actually sent.
        </p>
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
