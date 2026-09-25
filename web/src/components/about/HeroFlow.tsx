/**
 * ANIMATION 01 — hero harness flow.
 *
 * A looping SVG: the developer activates, a signal travels down into UseCoded,
 * context / tools / models illuminate one at a time, and the signal exits
 * toward the result. Pure CSS on SVG (stroke-dashoffset + opacity), so it runs
 * on the compositor and never re-renders. Reduced motion holds every node lit.
 */
const CYCLE = 2.8;

const NODES = [
  { id: "developer", x: 70, y: 6, w: 120, h: 32, label: "Developer", delay: 0 },
  { id: "usecoded", x: 40, y: 74, w: 180, h: 58, label: "USECODED", delay: 0.5 },
  { id: "context", x: 8, y: 158, w: 76, h: 32, label: "Context", delay: 1.1 },
  { id: "tools", x: 92, y: 158, w: 76, h: 32, label: "Tools", delay: 1.35 },
  { id: "models", x: 176, y: 158, w: 76, h: 32, label: "Models", delay: 1.6 },
  { id: "result", x: 80, y: 232, w: 100, h: 32, label: "Result", delay: 2.25 },
];

/** Connectors, each with the delay at which its signal travels. */
const WIRES = [
  { d: "M130 38 L130 74", delay: 0.2 },
  { d: "M130 132 L130 158", delay: 0.8 },
  { d: "M46 190 L46 210 L214 210 L214 190", delay: 1.85 },
  { d: "M130 210 L130 232", delay: 2.1 },
];

export function HeroFlow() {
  return (
    <svg
      viewBox="0 0 260 264"
      role="img"
      aria-label="A developer request travels into the UseCoded harness, through context, tools and models, and out as a result."
      className="mx-auto w-full max-w-[320px]"
    >
      <title>UseCoded harness flow</title>

      <g stroke="var(--color-line)" strokeWidth="1" fill="none">
        {WIRES.map((wire) => (
          <path key={wire.d} d={wire.d} />
        ))}
      </g>

      <g
        stroke="var(--color-gilt)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      >
        {WIRES.map((wire) => (
          <path
            key={wire.d}
            d={wire.d}
            pathLength={1}
            className="about-flow-signal"
            style={{ animationDelay: `${wire.delay}s`, animationDuration: `${CYCLE}s` }}
          />
        ))}
      </g>

      {NODES.map((node) => {
        const isHarness = node.id === "usecoded";
        return (
          <g
            key={node.id}
            className="about-node-lit"
            style={{ animationDelay: `${node.delay}s`, animationDuration: `${CYCLE}s` }}
          >
            {isHarness ? (
              <>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  fill="rgba(228,180,92,0.10)"
                  stroke="var(--color-gilt)"
                />
                <text
                  x={node.x + node.w / 2}
                  y={node.y + 22}
                  textAnchor="middle"
                  className="fill-gilt font-mono"
                  fontSize="9"
                  letterSpacing="1.6"
                >
                  USECODED
                </text>
                <text
                  x={node.x + node.w / 2}
                  y={node.y + 40}
                  textAnchor="middle"
                  className="fill-moon font-serif"
                  fontSize="13"
                >
                  AI Coding Harness
                </text>
              </>
            ) : (
              <>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  fill="rgba(8,14,32,0.4)"
                  stroke="var(--color-line)"
                />
                <text
                  x={node.x + node.w / 2}
                  y={node.y + node.h / 2 + 3}
                  textAnchor="middle"
                  className="fill-moon font-mono"
                  fontSize="9"
                  letterSpacing="1"
                >
                  {node.label.toUpperCase()}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
