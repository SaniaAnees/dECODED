"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const TERMINAL_CMD = 'export ANTHROPIC_BASE_URL="http://localhost:8080/v1"';
const springEase = [0.22, 1, 0.36, 1] as const;

export function HeroSection() {
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
    <section id="beta" className="relative pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-500/8 blur-[120px]" />
        <div className="absolute top-20 right-0 h-[300px] w-[400px] rounded-full bg-cyan-500/6 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: springEase }}
        >
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide",
              "border border-border bg-surface text-muted",
              "hover:border-purple-500/40 hover:bg-[#1e1f20] transition-all"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Private Beta
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: springEase }}
          className="mt-8 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-4xl font-bold leading-tight tracking-tight text-transparent sm:text-6xl"
        >
          10x Faster Agents. 70% Cheaper API Bills. Zero Context Loss.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: springEase }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg"
        >
          Lossless Memory &amp; Prefix-Cached Proxy for AI Coding Agents. Stop
          agent context drift and maximize KV-cache hits with a 1-line setup.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: springEase }}
          className="mx-auto mt-10 max-w-md"
        >
          <AnimatePresence mode="wait">
            {!joined ? (
              <motion.form
                key="form"
                onSubmit={handleJoin}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className={cn(
                    "flex-1 rounded-xl px-4 py-3 text-sm",
                    "border border-border bg-surface text-foreground placeholder:text-muted/60",
                    "outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20",
                    "hover:border-purple-500/40 hover:bg-[#1e1f20] transition-all"
                  )}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "rounded-xl px-6 py-3 text-sm font-medium whitespace-nowrap",
                    "bg-gradient-to-r from-indigo-500 to-purple-500 text-white",
                    "glow-button transition-all"
                  )}
                >
                  Join Private Beta
                </motion.button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "flex items-center justify-center gap-3 rounded-xl px-6 py-4",
                  "border border-emerald-500/30 bg-surface glow-border"
                )}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                    delay: 0.1,
                  }}
                >
                  <Check className="h-5 w-5 text-emerald-400" />
                </motion.div>
                <span className="text-sm font-medium text-emerald-300">
                  You&apos;re on the list! Check your inbox soon.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: springEase }}
          className="mx-auto mt-8 max-w-xl"
        >
          <div
            className={cn(
              "group flex items-center gap-3 rounded-xl px-4 py-3 text-left",
              "border border-border bg-surface",
              "hover:border-purple-500/40 hover:bg-[#1e1f20] transition-all"
            )}
          >
            <Terminal className="h-4 w-4 shrink-0 text-indigo-400" />
            <code className="flex-1 overflow-x-auto font-mono text-xs text-muted md:text-sm">
              {TERMINAL_CMD}
            </code>
            <motion.button
              onClick={handleCopy}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                "border border-border bg-canvas",
                "hover:border-purple-500/40 transition-all",
                copied && "border-emerald-500/40 text-emerald-400"
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
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
