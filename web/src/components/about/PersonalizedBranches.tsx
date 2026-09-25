"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

type Branch = {
  id: string;
  label: string;
  parts: string[];
};

const BRANCHES: Branch[] = [
  {
    id: "coding",
    label: "Coding",
    parts: ["Repository", "Context", "Tools", "Tests"],
  },
  {
    id: "hackathon",
    label: "Hackathon",
    parts: ["Teams", "AI access", "Credits", "Build", "Submission"],
  },
  {
    id: "custom",
    label: "Custom",
    parts: ["Your tools", "Your models", "Your context", "Your workflow"],
  },
];

/**
 * PERSONALIZATION — one harness, different ways to build.
 *
 * A real tab set: three <button> controls, CODING selected by default. The user
 * controls the selection; scrolling never changes it. Arrow keys move between
 * options. No auto-rotation.
 */
export function PersonalizedBranches() {
  const [active, setActive] = useState(BRANCHES[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const branch = BRANCHES.find((item) => item.id === active) ?? BRANCHES[0];

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const current = BRANCHES.findIndex((item) => item.id === active);
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (current + delta + BRANCHES.length) % BRANCHES.length;
    setActive(BRANCHES[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="mt-10">
      <p className="text-center font-mono text-[11px] tracking-[0.24em] text-gilt">
        USECODED
      </p>

      <div
        role="tablist"
        aria-label="Harness type"
        onKeyDown={onKeyDown}
        className="mt-6 grid gap-3 sm:grid-cols-3"
      >
        {BRANCHES.map((item, index) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`harness-tab-${item.id}`}
              aria-selected={selected}
              aria-controls="harness-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.id)}
              className={cn(
                "min-h-[3.25rem] border px-5 py-3 font-mono text-[12px] tracking-[0.18em] transition-colors",
                selected
                  ? "border-gilt/60 bg-gilt/10 text-gilt"
                  : "border-line bg-ink/40 text-moon hover:border-gilt/40",
              )}
            >
              {item.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      <div
        id="harness-panel"
        role="tabpanel"
        aria-labelledby={`harness-tab-${branch.id}`}
        tabIndex={0}
        className="mt-6 border border-line bg-ink/40 p-6 md:p-8"
      >
        <ul key={branch.id} className="about-panel-in grid gap-3 sm:grid-cols-2">
          {branch.parts.map((part) => (
            <li
              key={part}
              className="font-serif text-[16px] leading-snug text-mist"
            >
              {part}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
