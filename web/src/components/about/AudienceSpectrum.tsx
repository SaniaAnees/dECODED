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
 * AUDIENCE — one continuous horizontal track.
 *
 * A single track holds two copies of the sequence and translates -50% on a
 * loop, so it travels through a masked viewport and repeats without a visible
 * jump. The arrows live inside the track, so they move with the labels. The
 * second copy is aria-hidden, so the list is announced once. Pauses on hover
 * and on keyboard focus; reduced motion stops it without hiding anything.
 */
export function AudienceSpectrum() {
  return (
    <div className="about-marquee-wrap relative w-full overflow-hidden py-4">
      <div className="about-marquee flex w-max whitespace-nowrap">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex items-center whitespace-nowrap"
            aria-hidden={copy === 1 || undefined}
          >
            {AUDIENCE.map((word) => (
              <li key={word} className="flex items-center">
                <span className="px-5 font-mono text-[12px] tracking-[0.24em] text-moon md:px-7 md:text-[14px]">
                  {word.toUpperCase()}
                </span>
                <span
                  aria-hidden
                  className="font-mono text-[12px] text-gilt/60 md:text-[14px]"
                >
                  →
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
