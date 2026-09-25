"use client";

import { Fragment } from "react";
import { useInView } from "@/components/about/useMotion";
import { cn } from "@/lib/utils";

const STEPS = ["Team", "Harness", "AI access", "Build", "Submission"];

/**
 * ANIMATION 06 — hackathon harness.
 *
 * Reaching the section starts a continuous flow: each stage lights in turn and
 * a signal travels down the connector between them, so the first specialised
 * harness reads as a working system rather than a list.
 */
export function HackathonFlow() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  return (
    <div ref={ref} className="flex flex-col items-center">
      {STEPS.map((step, index) => {
        const isHarness = index === 1;
        return (
          <Fragment key={step}>
            <span
              className={cn(
                "border px-6 py-3 font-mono text-[11px] tracking-[0.2em]",
                isHarness
                  ? "border-gilt/60 bg-gilt/10 text-gilt"
                  : "border-line bg-ink/40 text-moon",
                inView && "about-node-lit",
              )}
              style={{
                animationDelay: `${index * 0.45}s`,
                animationDuration: "2.6s",
              }}
            >
              {step.toUpperCase()}
            </span>

            {index < STEPS.length - 1 ? (
              <span aria-hidden className="relative h-10 w-px bg-line">
                {inView ? (
                  <span
                    className="about-signal absolute -left-[2px] top-0 h-1 w-1 rounded-full bg-gilt"
                    style={{ animationDelay: `${index * 0.45}s` }}
                  />
                ) : null}
              </span>
            ) : null}
          </Fragment>
        );
      })}

      <p className="mt-8 font-mono text-[10px] tracking-[0.16em] text-dusk">
        SHAPED AROUND HACKATHON TEAMS · BEING SHAPED
      </p>
    </div>
  );
}
