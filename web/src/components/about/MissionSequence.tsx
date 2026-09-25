"use client";

import { useStepObserver } from "@/components/about/useMotion";

/**
 * WHY — the problem, one concept at a time as it crosses the viewport.
 *
 * This section owns the problem statement only. How the harness answers it is
 * owned by the product section; the direction it enables is owned by the
 * personalization section.
 */
const CONCEPTS = [
  {
    word: "Cost",
    body: "Advanced coding workflows are powerful, but running them at length gets expensive.",
  },
  {
    word: "Context",
    body: "Long sessions accumulate context, and much of it is carried further than it needs to be.",
  },
  {
    word: "Shape",
    body: "Most setups are fixed, so they rarely fit how a particular developer actually works.",
  },
];

/**
 * WHY — one concept becomes active as it crosses the viewport.
 *
 * Normal document flow: each concept is a real block with its own height, and
 * the active one is whichever is in the middle band. Scrolling forward and back
 * moves the focus both ways. No pinning, no artificial height.
 */
export function MissionSequence() {
  const { rootRef, active } = useStepObserver(CONCEPTS.length);

  return (
    <div ref={rootRef} className="mt-14">
      <h2 className="max-w-4xl font-serif text-[1.75rem] font-medium uppercase leading-[1.15] tracking-tight text-moon sm:text-[2.25rem] md:text-[2.9rem]">
        More people should be able to build with frontier technology.
      </h2>

      <div className="mt-14 space-y-10">
        {CONCEPTS.map((concept, index) => (
          <div
            key={concept.word}
            data-step={index}
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
    </div>
  );
}
