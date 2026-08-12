"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  Image,
  Mic,
  Paperclip,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const suggestions = [
  { icon: Code2, label: "Refactor auth middleware", color: "text-blue-400" },
  { icon: Zap, label: "Optimize cache hit rate", color: "text-amber-400" },
  { icon: Sparkles, label: "Debug context drift", color: "text-purple-400" },
];

export function ChatPreview() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <section id="preview" className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
            Your{" "}
            <span className="gemini-gradient">agent workspace</span>
          </h2>
          <p className="mt-3 text-sm text-muted md:text-base">
            A Gemini-inspired interface for managing agents, context, and cache
            state.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "overflow-hidden rounded-2xl border border-border",
            "hover:border-purple-500/40 transition-all"
          )}
        >
          <div className="flex h-[480px] md:h-[520px]">
            <AnimatePresence initial={false}>
              {sidebarOpen && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="hidden shrink-0 overflow-hidden border-r border-border bg-surface md:block"
                >
                  <div className="flex h-full flex-col p-4">
                    <button
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
                        "border border-border hover:border-purple-500/40 hover:bg-[#1e1f20] transition-all"
                      )}
                    >
                      <Plus className="h-4 w-4" />
                      New session
                    </button>

                    <div className="mt-6 space-y-1">
                      <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted">
                        Recent
                      </p>
                      {["Auth refactor", "Cache optimizer", "Agent pipeline"].map(
                        (item) => (
                          <button
                            key={item}
                            className={cn(
                              "w-full rounded-lg px-3 py-2 text-left text-sm text-muted",
                              "hover:bg-canvas hover:text-foreground transition-all"
                            )}
                          >
                            {item}
                          </button>
                        )
                      )}
                    </div>

                    <div className="mt-auto rounded-xl border border-border bg-canvas p-3">
                      <p className="text-xs text-muted">Cache hit rate</p>
                      <p className="mt-1 text-lg font-medium gemini-gradient">
                        92.4%
                      </p>
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            <div className="relative flex flex-1 flex-col bg-canvas">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="rounded-lg p-1.5 hover:bg-surface transition-all"
                >
                  {sidebarOpen ? (
                    <ChevronLeft className="h-4 w-4 text-muted" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted" />
                  )}
                </button>
                <span className="text-xs text-muted">dECODED Workspace</span>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
                <motion.h3
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-center text-2xl font-medium md:text-3xl"
                >
                  Hello,{" "}
                  <span className="gemini-gradient">Sania</span>
                  . What shall we orchestrate today?
                </motion.h3>

                <div className="mt-8 grid w-full max-w-lg gap-3 sm:grid-cols-3">
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={s.label}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      whileHover={{ y: -2 }}
                      className={cn(
                        "rounded-xl border border-border bg-surface p-4 text-left",
                        "hover:border-purple-500/40 hover:bg-[#1e1f20] transition-all"
                      )}
                    >
                      <s.icon className={cn("h-4 w-4", s.color)} />
                      <p className="mt-2 text-xs leading-snug text-muted">
                        {s.label}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
                <div
                  className={cn(
                    "mx-auto flex max-w-2xl items-center gap-2 rounded-full",
                    "border border-border bg-surface px-4 py-2.5",
                    "hover:border-purple-500/40 hover:bg-[#1e1f20] transition-all"
                  )}
                >
                  <Paperclip className="h-4 w-4 shrink-0 text-muted" />
                  <span className="flex-1 text-sm text-muted">
                    Ask dECODED anything...
                  </span>
                  <div className="flex items-center gap-1">
                    <button className="rounded-full p-1.5 hover:bg-canvas transition-all">
                      <Image className="h-4 w-4 text-muted" />
                    </button>
                    <button className="rounded-full p-1.5 hover:bg-canvas transition-all">
                      <Mic className="h-4 w-4 text-muted" />
                    </button>
                    <button
                      className={cn(
                        "rounded-full p-1.5",
                        "bg-gradient-to-r from-indigo-500 to-purple-500",
                        "hover:opacity-90 transition-all"
                      )}
                    >
                      <Sparkles className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
