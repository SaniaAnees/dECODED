"use client";

import { useStepObserver } from "@/components/about/useMotion";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    id: "today",
    label: "Today",
    tone: "now" as const,
    items: [
      "AI coding harness",
      "Personalized harness",
      "Hackathon Harness",
    ],
  },
  {
    id: "next",
    label: "Next",
    tone: "later" as const,
    items: ["More workflow-specific harnesses"],
  },
  {
    id: "exploring",
    label: "Exploring",
    tone: "later" as const,
    items: ["Other agentic workflows"],
  },
];

/**
 * ANIMATION 09 — roadmap.
 *
 * A path across three states. Scrolling advances the active station, the line
 * extends to it, and that station's concepts appear. Progression, not
 * decoration. Horizontal on desktop, stacked vertically on mobile.
 */
export function RoadmapPath() {
  const { rootRef, active } = useStepObserver(STAGES.length);
  const progress = (active + 1) / STAGES.length;

  return (
    <div
      ref={rootRef}
      className="relative"
      style={{ height: `${STAGES.length * 80}vh` }}
    >
      {STAGES.map((stage, index) => (
        <div
          key={stage.id}
          data-step={index}
          aria-hidden
          className="absolute left-0 w-px"
          style={{
            top: `${(index / STAGES.length) * 100}%`,
            height: `${100 / STAGES.length}%`,
          }}
        />
      ))}

      <div className="sticky top-[4.5rem] flex min-h-[calc(100vh-4.5rem)] items-center">
        <div className="w-full">
          <div className="relative">
            <span aria-hidden className="absolute left-0 right-0 top-[7px] h-px bg-line" />
            <span
              aria-hidden
              className="about-path-fill absolute left-0 top-[7px] h-px bg-gilt"
              style={{ width: "100%", transform: `scaleX(${progress})` }}
            />

            <div className="relative grid gap-10 md:grid-cols-3 md:gap-8">
              {STAGES.map((stage, index) => {
                const isActive = index === active;
                const isReached = index <= active;
                return (
                  <div key={stage.id} className="min-w-0">
                    <span
                      aria-hidden
                      className={cn(
                        "mb-6 block h-[15px] w-[15px] rounded-full border",
                        isReached
                          ? "border-gilt bg-gilt"
                          : "border-line bg-[#0a1228]",
                      )}
                    />
                    <h3
                      className={cn(
                        "font-mono text-[11px] font-normal tracking-[0.2em]",
                        isActive
                          ? "text-gilt"
                          : isReached
                            ? "text-mist"
                            : "text-dusk",
                      )}
                    >
                      {stage.label.toUpperCase()}
                    </h3>
                    <ul
                      className={cn(
                        "mt-4 space-y-2.5 transition-opacity duration-500",
                        isReached ? "opacity-100" : "opacity-25",
                      )}
                    >
                      {stage.items.map((item) => (
                        <li
                          key={item}
                          className="font-serif text-[15px] leading-snug text-mist"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
