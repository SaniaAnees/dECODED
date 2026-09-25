import { Wordmark } from "@/components/landing/Wordmark";

const NODES: { x: number; y: number; delay: number }[] = [
  { x: 16, y: 18, delay: 0.55 },
  { x: 304, y: 18, delay: 0.7 },
  { x: 16, y: 92, delay: 0.85 },
  { x: 304, y: 92, delay: 1 },
];

const TRACES: { d: string; delay: number }[] = [
  { d: "M16 18 C 62 42, 112 88, 160 114", delay: 0.15 },
  { d: "M304 18 C 258 42, 208 88, 160 114", delay: 0.25 },
  { d: "M16 92 C 68 100, 112 108, 160 114", delay: 0.35 },
  { d: "M304 92 C 252 100, 208 108, 160 114", delay: 0.45 },
];

/**
 * ANIMATION 10 — the single brand interlude on the page.
 *
 * Thin traces and nodes assemble into the UseCoded wordmark, then the line
 * lands. Used once, between major movements, never repeated.
 */
export function BrandInterlude() {
  return (
    <section
      aria-label="UseCoded"
      className="about-band-solid relative py-24 md:py-32"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 md:px-8">
        <svg
          viewBox="0 0 320 120"
          aria-hidden
          focusable="false"
          className="w-full max-w-sm text-gilt/50"
        >
          <g fill="none" stroke="currentColor" strokeWidth="1">
            {TRACES.map((trace) => (
              <path
                key={trace.d}
                d={trace.d}
                pathLength={1}
                className="about-trace"
                style={{ animationDelay: `${trace.delay}s` }}
              />
            ))}
          </g>
          {NODES.map((node) => (
            <circle
              key={`${node.x}-${node.y}`}
              cx={node.x}
              cy={node.y}
              r="2.5"
              className="about-node-pop fill-gilt"
              style={{ animationDelay: `${node.delay}s` }}
            />
          ))}
        </svg>

        <div className="about-node-pop -mt-1" style={{ animationDelay: "1.15s" }}>
          <Wordmark link={false} className="text-2xl text-moon md:text-3xl" />
        </div>

        <p
          className="about-node-pop mt-10 text-center font-mono text-[12px] tracking-[0.34em] text-gilt md:text-[14px]"
          style={{ animationDelay: "1.5s" }}
        >
          BUILD AT THE EDGE.
        </p>
      </div>
    </section>
  );
}
