"use client";

import { SocialList } from "@/components/about/SocialLinks";
import { useInView } from "@/components/about/useMotion";
import { cn } from "@/lib/utils";
import { FOUNDER } from "@/lib/site";

const INTERESTS = ["AI SYSTEMS", "MULTI-AGENT WORKFLOWS", "CUDA", "RUST", "GO"];

/**
 * ANIMATION 08 — founder.
 *
 * The quote rises first, then the name, then the technical interests appear one
 * at a time. Deliberately slow and quiet; the paragraph itself is not animated
 * per word.
 */
export function FounderBlock() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const step = (ms: number) => ({ transitionDelay: `${ms}ms` });

  return (
    <div ref={ref}>
      <blockquote
        className="about-js-reveal max-w-3xl font-serif text-2xl italic leading-snug text-moon md:text-4xl"
        data-visible={inView}
      >
        “I want more people around the world to build with frontier technology
        without complexity or cost becoming the barrier.”
      </blockquote>

      <div className="mt-10 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p
          className="about-js-reveal font-mono text-[13px] tracking-[0.28em] text-gilt"
          data-visible={inView}
          style={step(240)}
        >
          {FOUNDER.name.toUpperCase()}
        </p>
        <p
          className="about-js-reveal font-mono text-[11px] tracking-[0.18em] text-dusk"
          data-visible={inView}
          style={step(340)}
        >
          {FOUNDER.title.toUpperCase()}, USECODED
        </p>
      </div>

      <p
        className="about-js-reveal mt-8 max-w-2xl font-serif text-[16px] leading-relaxed text-mist"
        data-visible={inView}
        style={step(440)}
      >
        I care about systems optimisation and try to apply that mindset wherever
        it helps. My interests sit across AI systems, multi-agent workflows, and
        low-level systems. Right now I’m spending most of my time working with
        frontier models while strengthening my fundamentals across areas such as
        CUDA, Rust, and Go.
      </p>

      <div
        className="about-js-reveal mt-8"
        data-visible={inView}
        style={step(560)}
      >
        <SocialList
          accounts={FOUNDER.socials}
          className="flex-wrap items-center gap-x-5 gap-y-3"
        />
      </div>

      <ul
        aria-label="Areas of interest"
        className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line pt-6"
      >
        {INTERESTS.map((label, index) => (
          <li
            key={label}
            className={cn(
              "about-js-reveal font-mono text-[11px] tracking-[0.22em] text-mist",
            )}
            data-visible={inView}
            style={step(700 + index * 180)}
          >
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
