"use client";

import { useInView } from "@/components/about/useMotion";

const TURNS = [
  { label: "TURN 1", width: 42 },
  { label: "TURN 2", width: 56 },
  { label: "TURN 3", width: 70 },
];

/**
 * CONTEXT — why context management matters.
 *
 * Normal flow. On entering view the turn bars grow from the left, then the
 * breakdown appears: the shared part is repeated, only the remainder is new.
 * No percentages and no invented figures.
 */
export function ContextTimeline() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  return (
    <div ref={ref} className="mt-12">
      <ol className="space-y-4">
        {TURNS.map((turn, index) => (
          <li key={turn.label} className="flex items-center gap-4">
            <span className="w-16 shrink-0 font-mono text-[10px] tracking-[0.14em] text-dusk">
              {turn.label}
            </span>
            <span className="flex h-3 flex-1 items-center">
              <span
                aria-hidden
                className="h-3 origin-left bg-gilt/45"
                style={{
                  width: `${turn.width}%`,
                  transform: inView ? "scaleX(1)" : "scaleX(0)",
                  transition: `transform 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 120}ms`,
                }}
              />
            </span>
          </li>
        ))}
      </ol>

      <div
        className="mt-10 grid gap-6 border-t border-line pt-6 sm:grid-cols-2"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "none" : "translateY(10px)",
          transition:
            "opacity 0.6s cubic-bezier(0.22,1,0.36,1) 420ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) 420ms",
        }}
      >
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-gilt">
            REPEATED
          </p>
          <span aria-hidden className="mt-3 block h-3 w-[42%] bg-gilt/60" />
          <p className="mt-3 font-serif text-[15px] leading-relaxed text-mist">
            Carried every turn. It can be held stable instead.
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-dusk">
            NEW
          </p>
          <span aria-hidden className="mt-3 block h-3 w-[14%] bg-line" />
          <p className="mt-3 font-serif text-[15px] leading-relaxed text-mist">
            The only part that actually changes.
          </p>
        </div>
      </div>
    </div>
  );
}
