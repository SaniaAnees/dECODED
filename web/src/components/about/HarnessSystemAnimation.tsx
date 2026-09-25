"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { prefersReducedMotion, useStepObserver } from "@/components/about/useMotion";
import { cn } from "@/lib/utils";

/**
 * HarnessSystemAnimation — the one system animation on the About page.
 *
 * A single coding intent sits in the middle and the system assembles around it:
 * context, then tools, then the model layer, then the UseCoded boundary and the
 * result. Nothing floats, nothing is decorative: each change is a new part of
 * the system becoming present.
 *
 * Progress comes from normal document scroll through six step sentinels, so the
 * sequence reverses cleanly. No wheel handler, no preventDefault, no nested
 * scroll container, no overflow changes.
 */

const STAGES = 6;

const CONTEXT_REFS = ["repo", "files", "history", "task state"];
const TOOL_REFS = ["edit", "run", "test"];
const RESULT_REFS = "change prepared · tests run · workflow complete";

function reveal(revealed: boolean, delay = 0, shift = 10): CSSProperties {
  return {
    opacity: revealed ? 1 : 0,
    transform: revealed ? "none" : `translateY(${shift}px)`,
    transition: `opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
  };
}

function stagger(revealed: boolean, index: number): CSSProperties {
  return {
    opacity: revealed ? 1 : 0,
    transform: revealed ? "none" : "translateX(-6px)",
    transition: `opacity 0.5s ease-out ${index * 90}ms, transform 0.5s ease-out ${index * 90}ms`,
  };
}

export function HarnessSystemAnimation() {
  // Server renders the assembled system so it reads without JavaScript.
  const { rootRef, active } = useStepObserver(STAGES, STAGES - 1);
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      shellRef.current?.setAttribute("data-reduced", "true");
    }
  }, []);

  const showContext = active >= 1;
  const showTools = active >= 2;
  const showModels = active >= 3;
  const showHarness = active >= 4;
  const showResult = active >= 5;

  return (
    <div ref={rootRef} className="relative mt-12" style={{ height: "240vh" }}>
      {Array.from({ length: STAGES }).map((_, index) => (
        <div
          key={index}
          data-step={index}
          aria-hidden
          className="absolute left-0 w-px"
          style={{
            top: `${(index / STAGES) * 100}%`,
            height: `${100 / STAGES}%`,
          }}
        />
      ))}

      <div className="sticky top-[4.5rem] flex min-h-[calc(100vh-4.5rem)] items-center">
        <div
          ref={shellRef}
          className="hsa mx-auto w-full max-w-5xl px-6 md:px-8"
        >
          {/* STAGE 5 — the harness boundary, strongest element */}
          <div
            className={cn(
              "relative border p-5 transition-colors duration-700 md:p-8",
              showHarness ? "border-gilt/60 bg-gilt/[0.04]" : "border-line",
            )}
          >
            <div
              className="hsa-hide flex flex-wrap items-baseline gap-x-3 gap-y-1"
              style={reveal(showHarness)}
            >
              <p className="font-mono text-[12px] tracking-[0.26em] text-gilt">
                USECODED
              </p>
              <p className="font-serif text-lg text-moon">
                AI Coding Harness
              </p>
            </div>

            {/* STAGE 2 — context boundary around the intent */}
            <div
              className={cn(
                "mt-6 border p-4 transition-colors duration-700 md:p-5",
                showContext
                  ? "border-gilt/35 bg-gilt/[0.03]"
                  : "border-transparent",
              )}
            >
              <p
                className="hsa-hide font-mono text-[10px] tracking-[0.22em] text-gilt"
                style={reveal(showContext)}
              >
                CONTEXT
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {CONTEXT_REFS.map((reference, index) => (
                  <li
                    key={reference}
                    className="hsa-hide font-mono text-[10px] tracking-[0.12em] text-mist"
                    style={stagger(showContext, index)}
                  >
                    {reference}
                  </li>
                ))}
              </ul>

              {/* STAGE 1 — the intent, present throughout */}
              <div className="mt-6 border-t border-line pt-5">
                <p className="font-mono text-[10px] tracking-[0.22em] text-dusk">
                  INTENT
                </p>
                <p className="mt-2 font-serif text-xl text-moon md:text-2xl">
                  Build the next version.
                </p>
              </div>
            </div>

            {/* STAGE 3 / 4 — tools and models, inside the same system */}
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="hsa-hide" style={reveal(showTools)}>
                <p className="font-mono text-[10px] tracking-[0.22em] text-gilt">
                  TOOLS
                </p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                  {TOOL_REFS.map((tool, index) => (
                    <li
                      key={tool}
                      className="hsa-hide font-mono text-[10px] tracking-[0.12em] text-mist"
                      style={stagger(showTools, index)}
                    >
                      {tool}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="hsa-hide" style={reveal(showModels, 60)}>
                <p className="font-mono text-[10px] tracking-[0.22em] text-gilt">
                  MODELS
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span aria-hidden className="h-px w-8 bg-line" />
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full border border-gilt/70"
                  />
                  <span className="font-mono text-[10px] tracking-[0.12em] text-mist">
                    provider layer
                  </span>
                </div>
              </div>
            </div>

            {/* STAGE 6 — the signal leaving as a result */}
            <div className="mt-8 border-t border-line pt-5">
              <div aria-hidden className="relative h-px w-full bg-line">
                <span
                  className="hsa-hide absolute inset-y-0 left-0 w-full origin-left bg-gilt"
                  style={{
                    transform: showResult ? "scaleX(1)" : "scaleX(0)",
                    transition:
                      "transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </div>
              <div
                className="hsa-hide mt-4 flex flex-wrap items-baseline justify-between gap-3"
                style={reveal(showResult)}
              >
                <p className="font-mono text-[10px] tracking-[0.22em] text-gilt">
                  RESULT
                </p>
                <p className="font-mono text-[10px] tracking-[0.12em] text-mist">
                  {RESULT_REFS}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
