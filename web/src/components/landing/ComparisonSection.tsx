"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const springEase = [0.22, 1, 0.36, 1] as const;

const withoutStats = [
  { label: "Cache Hit Rate", value: "0%", note: "Cache misses on every turn" },
  { label: "Context Size", value: "150k Token Bloat", note: null },
  { label: "Per-Turn Cost", value: "$14.50 / session", note: null },
  {
    label: "Code State",
    value: "Goldfish Memory Loss",
    note: "Lossy Summarization",
  },
];

const withStats = [
  { label: "Cache Hit Rate", value: "92.4%", note: "Byte-exact prefix hits" },
  { label: "Context Size", value: "Compact AST Diffs", note: null },
  {
    label: "Per-Turn Cost",
    value: "$1.20 / session",
    note: "70%+ Cost Savings",
  },
  {
    label: "Prefill Speed",
    value: "10x Faster Prefill",
    note: "0.2s vs 2.1s",
  },
];

export function ComparisonSection() {
  return (
    <section id="comparison" className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
            The difference is{" "}
            <span className="gemini-gradient">immediately measurable</span>
          </h2>
          <p className="mt-3 text-sm text-muted md:text-base">
            One line of config. Dramatically lower costs and zero context drift.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: springEase }}
            className="rounded-2xl border border-red-900/50 bg-[#1a0f12] p-6 shadow-md"
          >
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10">
                <X className="h-4 w-4 text-red-400" />
              </div>
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
                Traditional Agent Routing
              </span>
            </div>
            <p className="mb-4 text-sm font-medium text-red-300/70">
              Without dECODED
            </p>
            <div className="space-y-4">
              {withoutStats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-xs text-red-400/60">{stat.label}</p>
                  <p className="mt-0.5 text-base font-medium text-red-200/90">
                    {stat.value}
                  </p>
                  {stat.note && (
                    <p className="mt-0.5 text-xs text-red-400/50">{stat.note}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.15, duration: 0.5, ease: springEase }}
            className="rounded-2xl border border-emerald-500/50 bg-[#0d1f17] p-6 shadow-xl shadow-emerald-950/40"
          >
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                dECODED Proxy
              </span>
            </div>
            <p className="mb-4 text-sm font-medium">
              With{" "}
              <span className="gemini-gradient font-semibold">dECODED</span>
            </p>
            <div className="space-y-4">
              {withStats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-xs text-emerald-400/60">{stat.label}</p>
                  <p className="mt-0.5 text-base font-medium gemini-gradient">
                    {stat.value}
                  </p>
                  {stat.note && (
                    <p className="mt-0.5 text-xs text-emerald-400/70">
                      {stat.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
