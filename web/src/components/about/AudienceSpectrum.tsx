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
 * The audience spectrum as a moving strip. Pauses on hover and on keyboard
 * focus; only the first copy is exposed to assistive tech.
 */
export function AudienceSpectrum() {
  return (
    <div className="about-marquee-wrap relative w-full overflow-hidden py-4">
      <div className="about-marquee flex w-max">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex items-center"
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
