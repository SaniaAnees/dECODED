"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

type Visual = "harness" | "context" | "personalized";

type Panel = {
  id: string;
  index: string;
  title: string;
  body: string;
  visual: Visual;
};

const PANELS: Panel[] = [
  {
    id: "harness",
    index: "01",
    title: "AI Coding Harness",
    body: "UseCoded is the infrastructure layer around the coding workflow, connecting context, tools, models, and execution.",
    visual: "harness",
  },
  {
    id: "efficiency",
    index: "02",
    title: "Context + Token Efficiency",
    body: "Long-running agent sessions accumulate context. UseCoded focuses on making that repeated context more deliberate and efficient.",
    visual: "context",
  },
  {
    id: "personalized",
    index: "03",
    title: "Personalized Harnesses",
    body: "A harness can be shaped around a particular person's workflow, environment, constraints, or goals.",
    visual: "personalized",
  },
];

const TURNS = ["01", "02", "03", "04", "05", "06"];
const BRANCHES = ["Coding workflow", "Hackathon harness", "Custom workflow"];

/**
 * The primary product section. Each panel swaps in a diagram that explains the
 * capability rather than restating it in prose.
 */
export function BuildPanels() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (active + delta + PANELS.length) % PANELS.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  const panel = PANELS[active];

  return (
    <div>
      <div
        role="tablist"
        aria-label="What UseCoded builds"
        onKeyDown={onKeyDown}
        className="grid gap-3 md:grid-cols-3"
      >
        {PANELS.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`build-tab-${item.id}`}
              aria-selected={selected}
              aria-controls="build-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              className={cn(
                "flex min-h-[6.5rem] flex-col justify-between gap-6 border p-5 text-left transition-colors",
                selected
                  ? "border-gilt/60 bg-gilt/10"
                  : "border-line bg-ink/40 hover:border-gilt/40",
              )}
            >
              <span className="font-mono text-[11px] tracking-[0.2em] text-gilt">
                {item.index}
              </span>
              <span
                className={cn(
                  "font-serif text-xl leading-snug md:text-2xl",
                  selected ? "text-gilt" : "text-moon",
                )}
              >
                {item.title}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="build-panel"
        role="tabpanel"
        aria-labelledby={`build-tab-${panel.id}`}
        tabIndex={0}
        className="mt-6 grid gap-10 border border-line bg-ink/40 p-6 md:grid-cols-2 md:items-center md:p-8"
      >
        <p className="font-serif text-lg leading-relaxed text-mist">
          {panel.body}
        </p>
        <div key={panel.id}>
          {panel.visual === "harness" ? <HarnessVisual /> : null}
          {panel.visual === "context" ? <ContextVisual /> : null}
          {panel.visual === "personalized" ? <PersonalizedVisual /> : null}
        </div>
      </div>
    </div>
  );
}

function HarnessVisual() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="border border-gilt/60 bg-gilt/10 px-5 py-2.5 text-center">
        <p className="font-mono text-[10px] tracking-[0.22em] text-gilt">
          USECODED
        </p>
        <p className="mt-0.5 font-serif text-[15px] text-moon">
          AI Coding Harness
        </p>
      </div>
      <div className="grid w-full grid-cols-3 gap-2">
        {["Context", "Tools", "Models"].map((item, index) => (
          <span
            key={item}
            className="about-node-pop border border-line px-2 py-2 text-center font-mono text-[10px] tracking-[0.12em] text-moon"
            style={{ animationDelay: `${index * 0.12}s` }}
          >
            {item.toUpperCase()}
          </span>
        ))}
      </div>
      <span
        aria-hidden
        className="font-mono text-[12px] text-gilt/70"
      >
        ↓
      </span>
      <span className="border border-line px-5 py-2 font-mono text-[10px] tracking-[0.18em] text-moon">
        WORKFLOW
      </span>
    </div>
  );
}

function ContextVisual() {
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-dusk">
          ACCUMULATING
        </p>
        <ul className="mt-3 space-y-2">
          {TURNS.map((turn, index) => (
            <li key={turn} className="flex items-center gap-2">
              <span className="w-4 font-mono text-[10px] text-dusk">{turn}</span>
              <span
                className="about-bar h-1.5 flex-1 bg-line"
                style={{ animationDelay: `${index * 0.16}s` }}
              />
            </li>
          ))}
        </ul>
      </div>
      <div aria-hidden className="hidden font-mono text-gilt sm:block">
        →
      </div>
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-gilt">
          HELD STABLE
        </p>
        <ul className="mt-3 space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-12 font-mono text-[10px] text-gilt">REPEATED</span>
            <span className="about-node-pulse h-1.5 flex-1 bg-gilt/70" />
          </li>
          <li className="flex items-center gap-2">
            <span className="w-12 font-mono text-[10px] text-dusk">CHANGED</span>
            <span className="h-1.5 w-1/3 bg-line" />
          </li>
        </ul>
        <p className="mt-4 font-serif text-[14px] leading-relaxed text-mist">
          Repeated structure stays stable. Only changed information moves.
        </p>
      </div>
    </div>
  );
}

function PersonalizedVisual() {
  return (
    <div className="flex flex-col items-center">
      <div className="border border-gilt/60 bg-gilt/10 px-5 py-2.5">
        <p className="font-mono text-[10px] tracking-[0.22em] text-gilt">
          USECODED
        </p>
      </div>
      <div aria-hidden className="h-6 w-px bg-line" />
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {BRANCHES.map((branch, index) => (
          <span
            key={branch}
            className={cn(
              "about-node-pop border px-3 py-3 text-center font-mono text-[10px] tracking-[0.12em]",
              index === 1
                ? "border-gilt/60 bg-gilt/10 text-gilt"
                : "border-line text-moon",
            )}
            style={{ animationDelay: `${index * 0.12}s` }}
          >
            {branch.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
