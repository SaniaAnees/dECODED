"use client";

import { useState } from "react";
import { CopyCommand } from "@/components/landing/CopyCommand";
import { AGENT_EXPORT, AGENT_EXPORT_WIN } from "@/lib/site";

const tabs = [
  { id: "mac" as const, label: "macOS / Linux", text: AGENT_EXPORT },
  { id: "win" as const, label: "Windows", text: AGENT_EXPORT_WIN },
];

export function AgentShell() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("mac");
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];
  const isWindows = tab === "win";

  return (
    <div className="border border-line bg-ink/60 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] tracking-[0.18em] text-dusk">
          SECOND TERMINAL — AGENT SHELL
        </p>
        <div className="flex items-center gap-1">
          {tabs.map((item) => {
            const on = item.id === tab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`border-b px-3 py-1 font-mono text-[11px] tracking-[0.14em] transition-colors ${
                  on
                    ? "border-gilt text-gilt"
                    : "border-transparent text-dusk hover:text-moon"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <pre
        className={`mt-4 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-[1.65] text-moon/90 ${
          isWindows ? "text-[10px] sm:text-[11px]" : "text-[11px] sm:text-xs"
        }`}
      >
        {active.text}
      </pre>
      <CopyCommand
        text={active.text}
        label="Copy"
        className="mt-3 font-mono text-[11px] tracking-[0.14em] text-gilt hover:text-moon"
      />
    </div>
  );
}
