"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const TERMINAL_CMD = 'export ANTHROPIC_BASE_URL="http://localhost:8080/v1"';

const LOG_LINES = [
  {
    text: "$ decodedd-proxy --port 8080 --target https://api.anthropic.com",
    className: "text-[#e4e4e7]",
  },
  {
    text: "[proxy] Listening on http://localhost:8080",
    className: "text-[#60a5fa]",
  },
  {
    text: "[intercept] POST /v1/messages - model: claude-3-5-sonnet",
    className: "text-[#60a5fa]",
  },
  {
    text: "[prefix-align] Sorted 14 tool schemas -> Prefix hash matched (byte-exact)",
    className: "text-[#a1a1aa]",
  },
  {
    text: "[upstream] Response 200 OK | tokens: { input: 84200, cache_read: 80000, cache_write: 4200 }",
    className: "text-[#a1a1aa]",
  },
  {
    text: "[stats] Cache Hit Rate: 95.0% | Turn Savings: $0.216 (90% off cached tokens)",
    className: "text-[#34d399]",
  },
];

export function BetaAndTerminal() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setJoined(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(TERMINAL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="beta" className="mt-8 space-y-3">
      {joined ? (
        <div className="flex max-w-xl items-center gap-2 rounded-lg border border-[#22262b] bg-[#121316] px-4 py-3 text-sm text-[#e4e4e7]">
          <Check className="h-4 w-4 text-[#34d399]" />
          You&apos;re on the beta list.
        </div>
      ) : (
        <form
          onSubmit={handleJoin}
          className="flex max-w-xl flex-col gap-2 sm:flex-row"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="flex-1 rounded-lg border border-[#22262b] bg-[#121316] px-4 py-2.5 text-sm text-[#e4e4e7] placeholder:text-[#6b7280] outline-none focus:border-[#3f3f46]"
          />
          <button
            type="submit"
            className="rounded-lg border border-[#22262b] bg-[#121316] px-5 py-2.5 text-sm font-medium text-[#e4e4e7] transition-colors hover:border-[#3f3f46] hover:bg-[#181a1f]"
          >
            Join Private Beta
          </button>
        </form>
      )}

      <div id="setup" className="flex max-w-xl items-center gap-3 rounded-lg border border-[#22262b] bg-[#121316] px-4 py-3">
        <code className="flex-1 overflow-x-auto font-mono text-xs text-[#9ca3af] sm:text-sm">
          {TERMINAL_CMD}
        </code>
        <button
          onClick={handleCopy}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md border border-[#22262b] px-3 py-1.5 font-mono text-xs text-[#9ca3af] transition-colors hover:bg-[#181a1f] hover:text-[#e4e4e7]",
            copied && "text-[#34d399]"
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function TerminalPreview() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= LOG_LINES.length) {
      const reset = setTimeout(() => setVisibleLines(0), 4000);
      return () => clearTimeout(reset);
    }
    const timer = setTimeout(() => setVisibleLines((n) => n + 1), 5000);
    return () => clearTimeout(timer);
  }, [visibleLines]);

  return (
    <div className="mt-12 overflow-hidden rounded-xl border border-[#1e2227] bg-[#0e0f12] shadow-2xl">
      <div className="flex items-center gap-2 border-b border-[#1e2227] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-xs text-[#6b7280]">
          decodedd-proxy — zsh
        </span>
      </div>
      <div className="min-h-[220px] p-4 font-mono text-[13px] leading-relaxed">
        {LOG_LINES.slice(0, visibleLines).map((line, i) => (
          <p key={i} className={line.className}>
            {line.text}
          </p>
        ))}
        {visibleLines < LOG_LINES.length && (
          <span className="mt-1 inline-block h-4 w-2 animate-pulse bg-[#34d399]/50" />
        )}
      </div>
    </div>
  );
}
