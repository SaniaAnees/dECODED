/**
 * The only place on the page where implementation detail lives. Kept as a
 * compact disclosure so it informs without becoming the story.
 */
export function ImplementationNote() {
  return (
    <details className="group mt-10 border border-line bg-ink/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-[11px] tracking-[0.22em] text-gilt">
          CURRENT IMPLEMENTATION
        </span>
        <span
          aria-hidden
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gilt/50 font-mono text-[12px] leading-none text-gilt"
        >
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
      </summary>

      <div className="border-t border-line px-5 py-4">
        <p className="max-w-2xl font-serif text-[15px] leading-relaxed text-mist">
          The current implementation runs locally and uses the local machine as
          the execution boundary for the workflow. Provider keys stay on that
          machine, and request normalization happens in the same process.
        </p>
      </div>
    </details>
  );
}
