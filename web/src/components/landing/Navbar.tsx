"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-canvas/80 backdrop-blur-xl"
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="#" className="group flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              "border border-border bg-surface",
              "group-hover:border-purple-500/40 group-hover:bg-[#1e1f20] transition-all"
            )}
          >
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
          <span className="text-lg font-medium tracking-wide">
            d<span className="gemini-gradient">ECODED</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#comparison"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Compare
          </a>
          <a
            href="#features"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#preview"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Preview
          </a>
        </div>

        <a
          href="#beta"
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium",
            "border border-border bg-surface",
            "hover:border-purple-500/40 hover:bg-[#1e1f20] transition-all"
          )}
        >
          Join Beta
        </a>
      </nav>
    </motion.header>
  );
}
