/**
 * Hero / product visual.
 *
 * One architecture, readable with every animation disabled: the developer's
 * request enters the UseCoded harness, which contains context, tools, models
 * and the workflow, and leaves as a result. There is no separate agent layer.
 *
 * Motion is a single signal travelling the wires plus a pulsing indicator per
 * node — CSS on SVG, stroke-dashoffset and opacity only.
 */
const CYCLE = 2.8;

const WIRES = [
  { d: "M130 34 L130 62", delay: 0.15 },
  { d: "M130 186 L130 212", delay: 1.6 },
];

const INTERNALS = [
  { label: "Context", y: 124, delay: 0.75 },
  { label: "Tools", y: 141, delay: 0.95 },
  { label: "Models", y: 158, delay: 1.15 },
  { label: "Workflow", y: 175, delay: 1.35 },
];

export function HeroFlow() {
  return (
    <svg
      viewBox="0 0 260 246"
      role="img"
      aria-label="The developer's request enters the UseCoded AI coding harness, which contains context, tools, models and workflow, and leaves as a result."
      className="mx-auto w-full max-w-[340px]"
    >
      <title>UseCoded AI coding harness</title>

      {/* Developer */}
      <rect
        x="70"
        y="6"
        width="120"
        height="28"
        fill="rgba(8,14,32,0.4)"
        stroke="var(--color-line)"
      />
      <text
        x="130"
        y="24"
        textAnchor="middle"
        className="fill-moon font-mono"
        fontSize="9"
        letterSpacing="1.2"
      >
        DEVELOPER
      </text>
      <circle
        cx="76"
        cy="20"
        r="2"
        className="about-node-lit fill-gilt"
        style={{ animationDelay: "0s", animationDuration: `${CYCLE}s` }}
      />

      {/* Harness */}
      <rect
        x="28"
        y="62"
        width="204"
        height="124"
        fill="rgba(228,180,92,0.10)"
        stroke="var(--color-gilt)"
      />
      <text
        x="130"
        y="84"
        textAnchor="middle"
        className="fill-gilt font-mono"
        fontSize="9"
        letterSpacing="1.8"
      >
        USECODED
      </text>
      <text
        x="130"
        y="102"
        textAnchor="middle"
        className="fill-moon font-serif"
        fontSize="12"
      >
        AI Coding Harness
      </text>
      <circle
        cx="34"
        cy="78"
        r="2"
        className="about-node-lit fill-gilt"
        style={{ animationDelay: "0.45s", animationDuration: `${CYCLE}s` }}
      />
      <line
        x1="42"
        y1="112"
        x2="218"
        y2="112"
        stroke="var(--color-line)"
      />

      {INTERNALS.map((row) => (
        <g key={row.label}>
          <circle
            cx="46"
            cy={row.y - 4}
            r="2"
            className="about-node-lit fill-gilt"
            style={{
              animationDelay: `${row.delay}s`,
              animationDuration: `${CYCLE}s`,
            }}
          />
          <text
            x="60"
            y={row.y}
            className="fill-moon font-mono"
            fontSize="9"
            letterSpacing="0.8"
          >
            {row.label.toUpperCase()}
          </text>
        </g>
      ))}

      {/* Result */}
      <rect
        x="80"
        y="212"
        width="100"
        height="28"
        fill="rgba(8,14,32,0.4)"
        stroke="var(--color-line)"
      />
      <text
        x="130"
        y="230"
        textAnchor="middle"
        className="fill-moon font-mono"
        fontSize="9"
        letterSpacing="1.2"
      >
        RESULT
      </text>
      <circle
        cx="86"
        cy="226"
        r="2"
        className="about-node-lit fill-gilt"
        style={{ animationDelay: "1.9s", animationDuration: `${CYCLE}s` }}
      />

      {/* Wires: static track + travelling signal */}
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
            style={{
              animationDelay: `${wire.delay}s`,
              animationDuration: `${CYCLE}s`,
            }}
          />
        ))}
      </g>
    </svg>
  );
}
