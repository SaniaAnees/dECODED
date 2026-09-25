"use client";

import { useInView } from "@/components/about/useMotion";

const STAGES = [
  {
    id: "today",
    label: "Today",
    tone: "now" as const,
    items: ["AI coding harness", "Personalized harness", "Hackathon Harness"],
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
 * WHERE — roadmap.
 *
 * Normal flow. Entering view draws the path across the three stages and reveals
 * them in order, so progression is legible without pinning the page.
 */
export function RoadmapPath() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  return (
    <div ref={ref} className="mt-12">
      <div className="relative">
        <span
          aria-hidden
          className="absolute left-0 right-0 top-[7px] hidden h-px bg-line md:block"
        />
        <span
          aria-hidden
          className="absolute left-0 right-0 top-[7px] hidden h-px origin-left bg-gilt md:block"
          style={{
            transform: inView ? "scaleX(1)" : "scaleX(0)",
            transition: "transform 1.1s cubic-bezier(0.22,1,0.36,1)",
          }}
        />

        <div className="relative grid gap-10 md:grid-cols-3 md:gap-8">
          {STAGES.map((stage, index) => (
            <div
              key={stage.id}
              className="min-w-0"
              style={{
                opacity: inView ? 1 : 0.3,
                transform: inView ? "none" : "translateY(12px)",
                transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 180}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 180}ms`,
              }}
            >
              <span
                aria-hidden
                className={
                  stage.tone === "now"
                    ? "mb-6 block h-[15px] w-[15px] rounded-full border border-gilt bg-gilt"
                    : "mb-6 block h-[15px] w-[15px] rounded-full border border-line bg-[#0a1228]"
                }
              />
              <h3
                className={
                  stage.tone === "now"
                    ? "font-mono text-[11px] font-normal tracking-[0.2em] text-gilt"
                    : "font-mono text-[11px] font-normal tracking-[0.2em] text-dusk"
                }
              >
                {stage.label.toUpperCase()}
              </h3>
              <ul className="mt-4 space-y-2.5">
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
          ))}
        </div>
      </div>
    </div>
  );
}
