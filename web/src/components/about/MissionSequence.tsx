"use client";

import { useStepObserver } from "@/components/about/useMotion";

const CONCEPTS = [
  {
    word: "Access",
    body: "Lower practical barriers of cost and complexity.",
  },
  {
    word: "Efficiency",
    body: "Make advanced AI development more economical to run and iterate.",
  },
  {
    word: "Personalization",
    body: "Let the harness adapt to the person and workflow.",
  },
];

/**
 * ANIMATION 02 — scroll-driven mission.
 *
 * The section pins while scrolling; access, efficiency and personalization
 * take focus in turn, the rule under the active concept extends, and concepts
 * already passed recede and shrink rather than disappearing.
 */
export function MissionSequence() {
  const { rootRef, active } = useStepObserver(CONCEPTS.length);

  return (
    <div
      ref={rootRef}
      className="relative"
      style={{ height: `${CONCEPTS.length * 85}vh` }}
    >
      {CONCEPTS.map((concept, index) => (
        <div
          key={concept.word}
          data-step={index}
          aria-hidden
          className="absolute left-0 w-px"
          style={{
            top: `${(index / CONCEPTS.length) * 100}%`,
            height: `${100 / CONCEPTS.length}%`,
          }}
        />
      ))}

      <div className="sticky top-[4.5rem] flex min-h-[calc(100vh-4.5rem)] items-center">
        <div className="w-full">
          <h2 className="max-w-4xl font-serif text-[1.75rem] font-medium uppercase leading-[1.15] tracking-tight text-moon sm:text-[2.25rem] md:text-[2.9rem]">
            More people should be able to build with frontier technology.
          </h2>

          <div className="mt-14 space-y-8">
            {CONCEPTS.map((concept, index) => (
              <div
                key={concept.word}
                className="about-mission-row"
                data-active={index === active}
                data-past={index < active}
              >
                <h3 className="font-serif text-2xl font-medium uppercase tracking-tight text-moon md:text-3xl">
                  {concept.word}
                </h3>
                <span aria-hidden className="about-mission-rule mt-3" />
                <p className="mt-3 max-w-xl font-serif text-[17px] leading-relaxed text-mist">
                  {concept.body}
                </p>
              </div>
            ))}
          </div>

          <p
            aria-hidden
            className="mt-12 font-mono text-[11px] tracking-[0.22em] text-dusk"
          >
            {String(active + 1).padStart(2, "0")} /{" "}
            {String(CONCEPTS.length).padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}
