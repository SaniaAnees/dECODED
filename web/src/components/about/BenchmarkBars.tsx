"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion, useInView } from "@/components/about/useMotion";
import { cn } from "@/lib/utils";

/**
 * Recorded TB2 pilot — two tasks, same model, three harnesses.
 * Shown as a labelled pilot, never as a general benchmark guarantee.
 */
const ROWS = [
  { name: "OpenCode", k: 160.3, highlight: false },
  { name: "usecoded-dev", k: 230.5, highlight: false },
  { name: "usecoded-v2", k: 123.4, highlight: true },
];

const MAX = 230.5;

/**
 * PROOF — measured, not asserted.
 *
 * Entering view grows the bars from zero and counts the values up to the
 * recorded figures. Transform for the bars, rAF for the counters.
 */
export function BenchmarkBars() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const [values, setValues] = useState<number[]>(ROWS.map(() => 0));

  useEffect(() => {
    if (!inView) return;
    const duration = prefersReducedMotion() ? 1 : 1300;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValues(ROWS.map((row) => Number((row.k * eased).toFixed(1))));
      if (t < 1) raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [inView]);

  return (
    <div ref={ref} className="mt-10 border border-line bg-ink/40 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <p className="font-mono text-[10px] tracking-[0.22em] text-gilt">
          TB2 PILOT
        </p>
        <p className="font-mono text-[10px] tracking-[0.16em] text-dusk">
          2-TASK PILOT
        </p>
      </div>

      <dl className="mt-6 space-y-5">
        {ROWS.map((row, index) => (
          <div key={row.name}>
            <div className="flex items-baseline justify-between gap-4">
              <dt
                className={cn(
                  "font-mono text-[12px] tracking-[0.14em]",
                  row.highlight ? "text-gilt" : "text-moon",
                )}
              >
                {row.name}
              </dt>
              <dd
                className={cn(
                  "font-mono text-[13px] tabular-nums",
                  row.highlight ? "text-gilt" : "text-mist",
                )}
              >
                {values[index].toFixed(1)}K input
              </dd>
            </div>
            <span aria-hidden className="mt-2 block h-2 w-full bg-line/50">
              <span
                className={cn(
                  "about-bar-line block h-2",
                  row.highlight ? "bg-gilt" : "bg-mist/60",
                )}
                data-grown={inView}
                style={{
                  width: `${(row.k / MAX) * 100}%`,
                  transitionDelay: `${index * 130}ms`,
                }}
              />
            </span>
          </div>
        ))}
      </dl>

      <p className="mt-8 max-w-xl font-serif text-[15px] leading-relaxed text-mist">
        Same model. Same tasks. Different harness.
      </p>
      <p className="mt-3 max-w-xl font-mono text-[10px] tracking-[0.14em] text-dusk">
        TWO TASKS, RECORDED · NOT A GENERAL BENCHMARK GUARANTEE
      </p>
    </div>
  );
}
