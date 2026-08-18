"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TURNS = 20;
const VANILLA_TOTAL = 4.5;
const DECODED_TOTAL = 0.8;
const WRITE_COST = 0.25;
const TICK_MS = 110;

const LOGS = [
  "$ decodedd-proxy --port 8080 --target https://api.anthropic.com",
  "[proxy] Listening on http://localhost:8080",
  "[intercept] POST /v1/messages — claude-3-5-sonnet",
  "[prefix-align] Tool schemas sorted → prefix hash matched",
  "[upstream] cache_read: 80000  cache_write: 4200",
  "[stats] Cache hit 90% · ~80% off the session",
];

function vanillaCost(turn: number) {
  return (VANILLA_TOTAL / TURNS) * turn;
}

function decodedCost(turn: number) {
  if (turn <= 0) return 0;
  if (turn === 1) return WRITE_COST;
  const rest = DECODED_TOTAL - WRITE_COST;
  return WRITE_COST + (rest / (TURNS - 1)) * (turn - 1);
}

function decodedHit(turn: number) {
  if (turn <= 1) return 0;
  return 90;
}

function logForTurn(turn: number) {
  if (turn <= 0) return "";
  const index = Math.min(LOGS.length - 1, Math.floor((turn - 1) / 4));
  return LOGS[index];
}

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function Lane({
  label,
  cost,
  hit,
  turn,
  accent,
}: {
  label: string;
  cost: number;
  hit: number;
  turn: number;
  accent?: boolean;
}) {
  return (
    <div className="p-6 md:p-8">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={cn(
          "mt-5 font-mono text-4xl tabular-nums tracking-tight md:text-5xl",
          accent ? "text-accent" : "text-heading"
        )}
      >
        {money(cost)}
      </p>
      <p className="mt-1 text-sm text-muted">20-turn session</p>

      <div className="mt-8">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted">Cache hit</span>
          <span className="font-mono tabular-nums text-heading">{hit}%</span>
        </div>
        <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-border">
          <div
            className={cn(
              "h-0.5 rounded-full",
              accent ? "bg-accent" : "bg-heading/25"
            )}
            style={{ width: `${hit}%` }}
          />
        </div>
      </div>

      <p className="mt-6 font-mono text-xs text-muted">
        Turn {turn} / {TURNS}
      </p>
    </div>
  );
}

export function CostDemo() {
  const ref = useRef<HTMLElement>(null);
  const [turn, setTurn] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setTurn(TURNS);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlaying(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (turn >= TURNS) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setTurn((t) => t + 1), TICK_MS);
    return () => window.clearTimeout(id);
  }, [playing, turn]);

  const replay = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTurn(reduce ? TURNS : 0);
    setPlaying(!reduce);
  };

  const log = logForTurn(turn);

  return (
    <section ref={ref} className="mx-auto max-w-5xl px-6 py-16 md:py-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm text-heading">A 20-turn session</h2>
          <p className="mt-1 text-sm text-muted">
            Same agent. Prefix cache on or off.
          </p>
        </div>
        <button
          type="button"
          onClick={replay}
          className="text-sm text-muted transition-colors hover:text-heading"
        >
          Replay
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border">
        <div className="grid md:grid-cols-2 md:divide-x md:divide-border">
          <div className="border-b border-border md:border-b-0">
            <Lane
              label="Without dECODED"
              cost={vanillaCost(turn)}
              hit={0}
              turn={turn}
            />
          </div>
          <Lane
            label="With dECODED"
            cost={decodedCost(turn)}
            hit={decodedHit(turn)}
            turn={turn}
            accent
          />
        </div>
        <div className="border-t border-border bg-surface px-6 py-3">
          <p className="min-h-5 overflow-x-auto whitespace-nowrap font-mono text-xs text-muted">
            {log || "\u00a0"}
          </p>
        </div>
      </div>
    </section>
  );
}
