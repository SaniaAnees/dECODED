"use client";

import { motion } from "framer-motion";
import { GitBranch, Layers, Network, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Layers,
    title: "Deterministic Prefix Normalizer",
    description: "Forces 90%+ prompt cache hits.",
  },
  {
    icon: GitBranch,
    title: "Lossless AST State DAG",
    description: "Eliminates text summarization data loss.",
  },
  {
    icon: Network,
    title: "Shared Multi-Agent Memory Bus",
    description: "Pointer-based sub-agent context.",
  },
  {
    icon: Shield,
    title: "Zero-Trust Localhost Daemon",
    description: "Private code never leaves your machine.",
  },
];

export function FeatureCards() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
            Built for{" "}
            <span className="gemini-gradient">production agent workflows</span>
          </h2>
          <p className="mt-3 text-sm text-muted md:text-base">
            Every layer optimized for cache hits, context fidelity, and local
            privacy.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                delay: i * 0.1,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -2 }}
              className={cn(
                "group rounded-2xl border border-border bg-surface p-6",
                "hover:border-purple-500/40 hover:bg-[#1e1f20] transition-all"
              )}
            >
              <div
                className={cn(
                  "mb-4 flex h-10 w-10 items-center justify-center rounded-xl",
                  "border border-border bg-canvas",
                  "group-hover:border-purple-500/40 transition-all"
                )}
              >
                <feature.icon className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="text-base font-medium tracking-wide">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
