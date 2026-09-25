"use client";

import { useInView } from "@/components/about/useMotion";

/**
 * SECTION 3 — the transition out of the harness section. A single thin line
 * extending across the viewport, then the page continues into the next
 * chapter. No paragraph, no logo.
 */
export function SectionDivider() {
  const { ref, inView } = useInView<HTMLDivElement>(0.6);

  return (
    <div
      ref={ref}
      aria-hidden
      className="mx-auto max-w-5xl px-6 pt-16 md:px-8 md:pt-24"
    >
      <span className="relative block h-px w-full bg-line">
        <span
          className="absolute inset-0 block origin-left bg-gilt/70"
          style={{
            transform: inView ? "scaleX(1)" : "scaleX(0)",
            transition: "transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </span>
    </div>
  );
}
