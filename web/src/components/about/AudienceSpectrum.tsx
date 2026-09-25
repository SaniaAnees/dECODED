const AUDIENCE = [
  "Developers",
  "Engineers",
  "Solo builders",
  "Students",
  "Hackathon teams",
  "Small teams",
  "Other workflows",
];

/**
 * AUDIENCE — one logical list.
 *
 * This used to be a marquee, which required rendering the list twice so a
 * second copy could scroll in behind the first. That put two copies of the same
 * content in the DOM, so it is now a single static list.
 */
export function AudienceSpectrum() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-3 px-6 py-6 md:gap-x-6 md:px-8">
      {AUDIENCE.map((word, index) => (
        <li key={word} className="flex items-center gap-5 md:gap-6">
          <span className="font-mono text-[12px] tracking-[0.24em] text-moon md:text-[14px]">
            {word.toUpperCase()}
          </span>
          {index < AUDIENCE.length - 1 ? (
            <span
              aria-hidden
              className="font-mono text-[12px] text-gilt/60 md:text-[14px]"
            >
              →
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
