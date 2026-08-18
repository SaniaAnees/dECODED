"use client";

import { useState } from "react";
import { SETUP_CMD } from "@/lib/site";
import { cn } from "@/lib/utils";

export function CopyCommand() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SETUP_CMD);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard can fail in insecure contexts */
    }
  };

  return (
    <div
      id="setup"
      className="flex max-w-2xl items-stretch overflow-hidden rounded-lg border border-border bg-surface"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
        <span className="hidden font-mono text-sm text-muted sm:inline">$</span>
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px] text-heading">
          {SETUP_CMD}
        </code>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "shrink-0 px-4 text-sm font-medium transition-colors",
          copied
            ? "bg-accent text-canvas"
            : "bg-heading text-canvas hover:bg-white"
        )}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
