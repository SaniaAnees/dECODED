"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Step = {
  n: string;
  phase: "Origin" | "Current";
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    n: "01",
    phase: "Origin",
    title: "Experimenting",
    body: "Experimenting with AI coding agents.",
  },
  {
    n: "02",
    phase: "Origin",
    title: "Normalizer",
    body: "Built a request normalizer to keep important request structure stable.",
  },
  {
    n: "03",
    phase: "Origin",
    title: "Local tooling",
    body: "The experiment became local tooling around the agent workflow.",
  },
  {
    n: "04",
    phase: "Current",
    title: "AI coding harness",
    body: "The architecture expanded into the harness being built today.",
  },
  {
    n: "05",
    phase: "Current",
    title: "Personalized harness",
    body: "The harness is being shaped for different workflows.",
  },
];

/**
 * Scroll-driven vertical timeline. The rail fills and nodes light as they
 * enter view. Steps stay readable at rest, so nothing is lost without
 * JavaScript or with motion reduced.
 */
export function OriginTimeline() {
  const [reached, setReached] = useState(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const nodes = itemRefs.current.filter(Boolean) as HTMLLIElement[];
    if (!nodes.length) return;

    if (typeof IntersectionObserver === "undefined") {
      setReached(nodes.length);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = nodes.indexOf(entry.target as HTMLLIElement);
          if (index >= 0) setReached((prev) => Math.max(prev, index + 1));
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -12% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const activeCount = Math.max(reached, 1);

  return (
    <div className="relative">
      <p
        aria-hidden
        className="mb-8 font-mono text-[11px] tracking-[0.22em] text-dusk"
      >
        {String(activeCount).padStart(2, "0")} /{" "}
        {String(STEPS.length).padStart(2, "0")}
      </p>

      <ol className="relative">
        <div
          aria-hidden
          className="absolute bottom-3 left-[7px] top-3 w-px bg-line"
        />
        <div
          aria-hidden
          className="absolute left-[7px] top-3 w-px bg-gilt transition-[height] duration-700 ease-out"
          style={{
            height: `calc((100% - 1.5rem) * ${activeCount / STEPS.length})`,
          }}
        />

        {STEPS.map((step, index) => {
          const isActive = index < activeCount;
          const isCurrent = step.phase === "Current";
          const showPhase = index === 0 || STEPS[index - 1].phase !== step.phase;

          return (
            <li
              key={step.n}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="relative pb-10 pl-10 last:pb-0"
            >
              {showPhase ? (
                <p className="mb-5 font-mono text-[11px] tracking-[0.28em] text-gilt">
                  {isCurrent ? "CURRENT" : "ORIGIN"}
                </p>
              ) : null}

              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-[1.9rem] flex h-[15px] w-[15px] items-center justify-center rounded-full border",
                  isActive
                    ? isCurrent
                      ? "border-gilt bg-gilt"
                      : "border-gilt bg-transparent"
                    : "border-line bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "h-[5px] w-[5px] rounded-full",
                    isActive
                      ? isCurrent
                        ? "bg-[#0a1228]"
                        : "bg-gilt"
                      : "bg-line",
                  )}
                />
              </span>

              <div className="about-step" data-active={isActive}>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-gilt">
                    {step.n}
                  </span>
                  <h3 className="font-serif text-xl font-medium text-moon md:text-2xl">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-2 max-w-xl font-serif text-[16px] leading-relaxed text-mist">
                  {step.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
