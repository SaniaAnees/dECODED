"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { prefersReducedMotion, useStepObserver } from "@/components/about/useMotion";
import { cn } from "@/lib/utils";

/**
 * HarnessBuildAnimation — the centrepiece of the "WHAT WE BUILD" section.
 *
 * One object: the developer's intent. The surrounding system (context, tools,
 * models, then the harness boundary itself) assembles around it as the page
 * scrolls. Progress is driven entirely by normal document scroll through step
 * sentinels — no wheel handler, no preventDefault, no scroll container, no
 * overflow changes. Because the step is a pure function of scroll position the
 * whole sequence reverses cleanly on the way back up.
 */

const PHRASE = ["Build", "the", "next", "version."];
const CONTEXT_ITEMS = [
  "repository",
  "previous decisions",
  "constraints",
  "current state",
];
const TOOL_ITEMS = ["edit", "run", "test"];

/** 0 cursor · 1–4 typing · 5 intent frame · 6 context · 7 tools · 8 models · 9 harness · 10 result */
const STEPS = 11;
const FRAME_HEIGHT = "260vh";

function reveal(revealed: boolean, delay = 0, shift = 12): CSSProperties {
  return {
    opacity: revealed ? 1 : 0,
    transform: revealed ? "none" : `translateY(${shift}px)`,
    transition: `opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
  };
}

function LayerLabel({ children }: { children: string }) {
  return (
    <p className="font-mono text-[10px] tracking-[0.22em] text-gilt">
      {children}
    </p>
  );
}

export function HarnessBuildAnimation() {
  // Server renders the finished state so the section reads without JavaScript.
  const { rootRef, active } = useStepObserver(STEPS, STEPS - 1);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      frameRef.current?.setAttribute("data-reduced", "true");
    }
  }, []);

  const typedCount = Math.max(0, Math.min(PHRASE.length, active));
  const intentFrame = active >= 5;
  const showContext = active >= 6;
  const showTools = active >= 7;
  const showModels = active >= 8;
  const showHarness = active >= 9;
  const showResult = active >= 10;
  const lineProgress = active <= 5 ? 0 : Math.min(1, (active - 5) / 5);

  return (
    <div ref={rootRef} className="relative" style={{ height: FRAME_HEIGHT }}>
      {Array.from({ length: STEPS }).map((_, index) => (
        <div
          key={index}
          data-step={index}
          aria-hidden
          className="absolute left-0 w-px"
          style={{
            top: `${(index / STEPS) * 100}%`,
            height: `${100 / STEPS}%`,
          }}
        />
      ))}

      <div className="sticky top-[4.5rem] flex min-h-[calc(100vh-4.5rem)] items-center">
        <div
          ref={frameRef}
          className="hba mx-auto w-full max-w-5xl px-6 md:px-8"
        >
          <div
            className={cn(
              "relative border p-5 transition-colors duration-700 md:p-10",
              showHarness ? "border-gilt/60" : "border-line",
            )}
          >
            {/* INTENT */}
            <div
              className="relative z-10"
              style={{
                transform: intentFrame ? "translateX(1.5rem)" : "none",
                transition: "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <p className="hba-hide" style={reveal(intentFrame)}>
                <span className="font-mono text-[10px] tracking-[0.22em] text-gilt">
                  INTENT
                </span>
              </p>
              <p className="mt-3 font-serif text-lg text-moon md:text-2xl">
                {PHRASE.map((word, index) => (
                  <span
                    key={word}
                    className="hba-hide mr-[0.32em] inline-block"
                    style={{
                      opacity: index < typedCount ? 1 : 0,
                      transform:
                        index < typedCount ? "none" : "translateY(6px)",
                      transition:
                        "opacity 0.32s ease-out, transform 0.32s ease-out",
                    }}
                  >
                    {word}
                  </span>
                ))}
                <span
                  aria-hidden
                  className="hba-cursor ml-[0.08em] inline-block h-[0.95em] w-[2px] translate-y-[0.1em] bg-gilt align-middle"
                />
              </p>
            </div>

            {/* signal path */}
            <div aria-hidden className="relative mt-8 h-px w-full bg-line">
              <span
                className="hba-hide absolute inset-y-0 left-0 w-full origin-left bg-gilt"
                style={{
                  transform: `scaleX(${lineProgress})`,
                  transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            </div>

            {/* the environment assembling around the intent */}
            <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_1fr_1fr] md:gap-8">
              <div className="hba-hide" style={reveal(showContext)}>
                <LayerLabel>CONTEXT</LayerLabel>
                <ul className="mt-4 space-y-2.5">
                  {CONTEXT_ITEMS.map((item, index) => (
                    <li
                      key={item}
                      className="hba-hide flex items-center gap-3 font-mono text-[10px] tracking-[0.12em] text-mist"
                      style={{
                        opacity: showContext ? 1 : 0,
                        transform: showContext ? "none" : "translateX(-8px)",
                        transition: `opacity 0.5s ease-out ${index * 90}ms, transform 0.5s ease-out ${index * 90}ms`,
                      }}
                    >
                      <span aria-hidden className="h-px w-4 shrink-0 bg-line" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="hba-hide" style={reveal(showTools, 60)}>
                <LayerLabel>TOOLS</LayerLabel>
                <ul className="mt-4 space-y-2.5">
                  {TOOL_ITEMS.map((item, index) => (
                    <li
                      key={item}
                      className="hba-hide flex items-center gap-3 font-mono text-[10px] tracking-[0.12em] text-mist"
                      style={{
                        opacity: showTools ? 1 : 0,
                        transform: showTools ? "none" : "translateX(-8px)",
                        transition: `opacity 0.5s ease-out ${index * 90}ms, transform 0.5s ease-out ${index * 90}ms`,
                      }}
                    >
                      <span aria-hidden className="h-px w-4 shrink-0 bg-line" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="hba-hide" style={reveal(showModels, 120)}>
                <LayerLabel>MODELS</LayerLabel>
                <div className="mt-4 flex items-center gap-3">
                  <span aria-hidden className="h-px w-10 shrink-0 bg-line" />
                  <span aria-hidden className="h-2 w-2 shrink-0 rounded-full border border-gilt/70" />
                  <span className="font-mono text-[10px] tracking-[0.12em] text-mist">
                    interface
                  </span>
                </div>
              </div>
            </div>

            {/* the harness itself */}
            <div className="mt-10 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-6">
              <p
                className="hba-hide font-mono text-[12px] tracking-[0.26em] text-gilt"
                style={reveal(showHarness)}
              >
                USECODED
              </p>
              <p
                className="hba-hide font-serif text-lg text-moon"
                style={reveal(showHarness, 140)}
              >
                AI Coding Harness
              </p>
              <span className="ml-auto flex items-center gap-3">
                <span
                  aria-hidden
                  className="hba-hide h-px w-12 origin-right bg-gilt"
                  style={{
                    transform: showResult ? "scaleX(1)" : "scaleX(0)",
                    transition:
                      "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
                <span
                  className="hba-hide font-mono text-[10px] tracking-[0.18em] text-mist"
                  style={reveal(showResult)}
                >
                  RESULT
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
