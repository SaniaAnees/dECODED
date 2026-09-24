const PARTS = [
  "AI access",
  "Workflow",
  "Limits / credits",
  "Building",
  "Submission",
];

/**
 * The first specialized harness. Parts of a hackathon are listed as the shape
 * the harness is being built around, and labelled as being shaped rather than
 * shipped, so nothing here reads as an adoption claim.
 */
export function HackathonFlow() {
  return (
    <div className="flex flex-col items-center">
      <span className="border border-line bg-ink/40 px-6 py-3 font-mono text-[11px] tracking-[0.2em] text-moon">
        TEAM
      </span>

      <div aria-hidden className="relative h-10 w-px bg-line">
        <span className="about-signal absolute -left-[2px] top-0 h-1 w-1 rounded-full bg-gilt" />
      </div>

      <span className="border border-gilt/60 bg-gilt/10 px-6 py-3 font-mono text-[11px] tracking-[0.2em] text-gilt">
        HACKATHON HARNESS
      </span>

      <div aria-hidden className="h-8 w-px bg-line" />

      <div className="w-full max-w-md border border-line bg-ink/40 p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] tracking-[0.2em] text-gilt">
            SHAPED AROUND
          </p>
          <p className="font-mono text-[10px] tracking-[0.16em] text-dusk">
            BEING SHAPED
          </p>
        </div>
        <ul className="mt-4 space-y-2.5">
          {PARTS.map((part, index) => (
            <li key={part} className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-gilt">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-serif text-[15px] text-moon">{part}</span>
              <span
                aria-hidden
                className="about-node-pulse ml-auto h-1.5 w-1.5 rounded-full bg-gilt"
                style={{ animationDelay: `${index * 0.35}s` }}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
