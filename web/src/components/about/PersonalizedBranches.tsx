"use client";

import { useStepObserver } from "@/components/about/useMotion";
import { cn } from "@/lib/utils";

const BRANCHES = [
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
 * ANIMATION 04 — personalized harness.
 *
 * One harness, three branches. Scrolling advances which branch is shaped: the
 * active branch expands and reveals the parts it is built from while the others
 * contract. Explanatory UI only, no backend data.
 */
export function PersonalizedBranches() {
  const { rootRef, active } = useStepObserver(BRANCHES.length);

  return (
    <div
      ref={rootRef}
      className="relative"
      style={{ height: `${BRANCHES.length * 85}vh` }}
    >
      {BRANCHES.map((branch, index) => (
        <div
          key={branch.id}
          data-step={index}
          aria-hidden
          className="absolute left-0 w-px"
          style={{
            top: `${(index / BRANCHES.length) * 100}%`,
            height: `${100 / BRANCHES.length}%`,
          }}
        />
      ))}

      <div className="sticky top-[4.5rem] flex min-h-[calc(100vh-4.5rem)] items-center">
        <div className="w-full">
          <div className="text-center">
            <div className="inline-block border border-gilt/60 bg-gilt/10 px-6 py-2.5">
              <p className="font-mono text-[11px] tracking-[0.24em] text-gilt">
                USECODED
              </p>
            </div>
            <div
              aria-hidden
              className="mx-auto h-8 w-px bg-line"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {BRANCHES.map((branch, index) => {
              const isActive = index === active;
              return (
                <div
                  key={branch.id}
                  className={cn(
                    "about-branch border p-5",
                    isActive
                      ? "border-gilt/60 bg-gilt/10"
                      : "border-line bg-ink/40",
                  )}
                  data-active={isActive}
                >
                  <p
                    className={cn(
                      "font-mono text-[11px] tracking-[0.2em]",
                      isActive ? "text-gilt" : "text-dusk",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3
                    className={cn(
                      "mt-3 font-serif text-xl font-medium md:text-2xl",
                      isActive ? "text-gilt" : "text-moon",
                    )}
                  >
                    {branch.label}
                  </h3>

                  <ul
                    className={cn(
                      "mt-4 space-y-2 border-t border-line pt-4 transition-opacity duration-500",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden={!isActive}
                  >
                    {branch.parts.map((part) => (
                      <li
                        key={part}
                        className="font-serif text-[15px] leading-snug text-mist"
                      >
                        {part}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <p className="mt-10 text-center font-mono text-[11px] tracking-[0.2em] text-dusk">
            ONE HARNESS · DIFFERENT WAYS TO BUILD
          </p>
        </div>
      </div>
    </div>
  );
}
