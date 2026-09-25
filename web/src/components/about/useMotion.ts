"use client";

import { useEffect, useRef, useState } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(REDUCED_QUERY).matches
  );
}

/**
 * Writes 0..1 progress for an element as it passes through the viewport into a
 * CSS custom property. No React re-render on scroll, so the motion stays on the
 * compositor. Used in normal document flow — never to pin a section. With
 * reduced motion the property is pinned to 1, showing the finished state.
 */
export function useScrollProgressVar<T extends HTMLElement>(varName = "--p") {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.style.setProperty(varName, "1");
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight;
      const progress = (viewport - rect.top) / (viewport + rect.height);
      el.style.setProperty(
        varName,
        Math.min(1, Math.max(0, progress)).toFixed(4),
      );
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [varName]);

  return ref;
}

/**
 * Sequential step activation. Render `count` sentinel elements carrying
 * `data-step={i}` inside the returned root; whichever sentinel is crossing the
 * middle of the viewport becomes active. Works in both scroll directions.
 *
 * `initial` is the state rendered on the server. Pass the finished step for
 * sequences that must be fully readable without JavaScript — the observer
 * replaces it with the real position as soon as it runs.
 */
export function useStepObserver(count: number, initial = 0) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(initial);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-step]"));
    if (!items.length) return;

    const seen = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.step);
          if (entry.isIntersecting) seen.add(index);
          else seen.delete(index);
        }
        setActive(seen.size ? Math.max(...seen) : 0);
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: 0 },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [count]);

  return { rootRef, active };
}

/** True once the element has entered the viewport. */
export function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
