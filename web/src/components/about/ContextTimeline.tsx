"use client";

import { useScrollProgressVar } from "@/components/about/useMotion";

const TURNS = ["TURN 01", "TURN 02", "TURN 03", "TURN 04"];

/**
 * ANIMATION 03 — context visualization.
 *
 * Continuous scroll progress drives the transform directly through the `--p`
 * custom property (no re-render). The repeated portion of every turn collapses
 * and the changed portion slides into its place, while the anchored block on
 * the left fills in: repeated context stays stable, only the delta moves.
 * Transform and opacity only, so nothing triggers layout.
 */
export function ContextTimeline() {
  const ref = useScrollProgressVar<HTMLDivElement>();

  return (
    <div ref={ref} className="relative" style={{ height: "220vh" }}>
      <div className="sticky top-[4.5rem] flex min-h-[calc(100vh-4.5rem)] items-center">
        <div className="grid w-full gap-12 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-center">
          <div className="flex items-center gap-5">
            <div className="relative h-44 w-14 shrink-0 overflow-hidden border border-gilt/50 bg-gilt/10 md:h-52">
              <span
                aria-hidden
                className="absolute inset-0 origin-top bg-gilt/55"
                style={{ transform: "scaleY(calc(0.22 + 0.78 * var(--p, 0)))" }}
              />
            </div>
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] text-gilt">
                REPEATED CONTEXT
              </p>
              <p className="mt-2 max-w-[15rem] font-serif text-[15px] leading-relaxed text-mist">
                Held stable across turns. It does not move.
              </p>
              <p
                className="mt-4 font-mono text-[10px] tracking-[0.16em] text-dusk"
                style={{ opacity: "calc(1 - var(--p, 0))" }}
              >
                BEFORE · CARRIED EVERY TURN
              </p>
              <p
                className="font-mono text-[10px] tracking-[0.16em] text-gilt"
                style={{ opacity: "var(--p, 0)" }}
              >
                AFTER · CARRIED ONCE
              </p>
            </div>
          </div>

          <ol className="space-y-4">
            {TURNS.map((turn) => (
              <li key={turn} className="flex items-center gap-4">
                <span className="w-16 shrink-0 font-mono text-[10px] tracking-[0.14em] text-dusk">
                  {turn}
                </span>
                <span className="relative flex h-3 flex-1 overflow-hidden">
                  <span
                    aria-hidden
                    className="h-full origin-right bg-gilt/45"
                    style={{
                      width: "62%",
                      transform: "scaleX(calc(1 - var(--p, 0)))",
                    }}
                  />
                  <span
                    aria-hidden
                    className="h-full bg-line"
                    style={{
                      width: "38%",
                      transform: "translateX(calc(-163% * var(--p, 0)))",
                    }}
                  />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-16 mx-auto max-w-5xl px-6 md:px-8">
        <p className="max-w-xl font-serif text-[15px] leading-relaxed text-mist">
          Repeated context can be kept stable while new information changes.
        </p>
      </div>
    </div>
  );
}
