import { cn } from "@/lib/utils";

const COMPONENTS = ["Context", "Tools", "Models"];
const HARNESS_PARTS = ["Context", "Tools", "Models", "Workflow"];

/**
 * The harness architecture. The hero variant fans the harness out into its
 * components; the box variant shows the harness as the containing layer.
 * Either way, UseCoded reads as the harness, not as a layer beneath an agent.
 */
export function HarnessDiagram({
  variant = "hero",
}: {
  variant?: "hero" | "box";
}) {
  return variant === "box" ? <BoxDiagram /> : <HeroDiagram />;
}

function Node({ label }: { label: string }) {
  return (
    <div className="border border-line bg-ink/40 px-5 py-3 text-center">
      <p className="font-mono text-[11px] tracking-[0.2em] text-moon">
        {label.toUpperCase()}
      </p>
    </div>
  );
}

function HarnessNode() {
  return (
    <div className="border border-gilt/60 bg-gilt/10 px-6 py-4 text-center">
      <p className="font-mono text-[11px] tracking-[0.24em] text-gilt">
        USECODED
      </p>
      <p className="mt-1 font-serif text-lg text-moon">AI Coding Harness</p>
    </div>
  );
}

function Stem() {
  return (
    <div aria-hidden className="relative h-10 w-px bg-line">
      <span className="about-signal absolute -left-[2px] top-0 h-1 w-1 rounded-full bg-gilt" />
    </div>
  );
}

function HeroDiagram() {
  return (
    <div className="flex flex-col items-center">
      <Node label="Developer" />
      <Stem />
      <HarnessNode />
      <Stem />

      <div className="relative w-full max-w-2xl">
        <div
          aria-hidden
          className="absolute left-[16.666%] right-[16.666%] top-0 hidden h-px bg-line md:block"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-0">
          {COMPONENTS.map((component) => (
            <div key={component} className="flex flex-col items-center">
              <div aria-hidden className="hidden h-8 w-px bg-line md:block" />
              <span className="w-full max-w-[11rem] border border-line bg-ink/40 px-4 py-3 text-center font-mono text-[11px] tracking-[0.16em] text-moon">
                {component.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Stem />
      <Node label="Workflow" />
      <Stem />
      <Node label="Software" />
    </div>
  );
}

function BoxDiagram() {
  return (
    <div className="flex flex-col items-center">
      <Node label="Developer" />
      <Stem />

      <div className="w-full max-w-md border border-gilt/60 bg-gilt/10 px-6 py-5">
        <div className="text-center">
          <p className="font-mono text-[11px] tracking-[0.24em] text-gilt">
            USECODED
          </p>
          <p className="mt-1 font-serif text-lg text-moon">AI Coding Harness</p>
        </div>

        <ul className="mt-5 space-y-2.5 border-t border-line pt-4">
          {HARNESS_PARTS.map((part, index) => (
            <li key={part} className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-gilt">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-serif text-[15px] text-moon">{part}</span>
              <span
                aria-hidden
                className="about-node-pulse ml-auto h-1.5 w-1.5 rounded-full bg-gilt"
                style={{ animationDelay: `${index * 0.4}s` }}
              />
            </li>
          ))}
        </ul>
      </div>

      <Stem />
      <Node label="Result" />
    </div>
  );
}

export function HarnessLegend({ className }: { className?: string }) {
  return (
    <p className={cn("font-mono text-[10px] tracking-[0.18em] text-dusk", className)}>
      CONTEXT · TOOLS · MODELS · EXECUTION
    </p>
  );
}
