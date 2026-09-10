"use client";

import { useState } from "react";
import { CopyCommand } from "@/components/landing/CopyCommand";
import { INSTALL_MAC_LINUX, INSTALL_NPM, RUN_COMMAND } from "@/lib/site";

const tabs = [
  { id: "mac-linux" as const, label: "Mac / Linux", text: INSTALL_MAC_LINUX },
  { id: "npm" as const, label: "npm (any OS)", text: INSTALL_NPM },
];

export function HeroInstall() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("mac-linux");
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div
      className="w-full max-w-xl rounded-[1.25rem] p-4 sm:p-5 backdrop-blur-md"
      style={{
        backgroundColor: "rgba(214, 218, 228, 0.72)",
        border: "1px solid rgba(247, 241, 230, 0.18)",
        boxShadow: "0 16px 40px rgba(8,14,32,0.28)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className="font-mono text-[11px] tracking-[0.18em]"
            style={{ color: "rgba(28, 35, 64, 0.55)" }}
          >
            INSTALL
          </p>
          <p
            className="mt-1 font-serif text-sm"
            style={{ color: "rgba(28, 35, 64, 0.78)" }}
          >
            Run one command, then start the harness locally.
          </p>
        </div>
        <div
          className="inline-flex rounded-full p-1"
          role="tablist"
          aria-label="Install commands"
          style={{
            backgroundColor: "rgba(28, 35, 64, 0.08)",
            border: "1px solid rgba(28, 35, 64, 0.1)",
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className="rounded-full px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] transition-colors"
                style={
                  isActive
                    ? { backgroundColor: "#1c2340", color: "#e8e6df" }
                    : { backgroundColor: "transparent", color: "rgba(28, 35, 64, 0.55)" }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="mt-4 rounded-xl p-3 sm:p-4"
        style={{
          backgroundColor: "rgba(28, 35, 64, 0.06)",
          border: "1px solid rgba(28, 35, 64, 0.1)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <pre
            className="min-w-0 overflow-x-auto whitespace-pre-wrap break-all pr-2 font-mono text-[12px] leading-[1.65] sm:text-[13px]"
            style={{ color: "#1c2340" }}
          >
            {active.text}
          </pre>
          <CopyCommand
            text={active.text}
            className="shrink-0 rounded-full px-3 py-1.5 font-mono text-[11px] tracking-[0.12em]"
            style={{
              backgroundColor: "rgba(247, 241, 230, 0.35)",
              border: "1px solid rgba(28, 35, 64, 0.12)",
              color: "rgba(28, 35, 64, 0.55)",
            }}
          />
        </div>
      </div>

      <p className="mt-3 font-serif text-sm" style={{ color: "rgba(28, 35, 64, 0.78)" }}>
        Then run:{" "}
        <code
          className="font-mono text-[12px] sm:text-[13px]"
          style={{ color: "#1c2340" }}
        >
          {RUN_COMMAND}
        </code>
      </p>
    </div>
  );
}
