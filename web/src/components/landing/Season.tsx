import Link from "next/link";
import { DemoClip } from "@/components/landing/DemoClip";
import { PROXY_SITE_URL, WORDMARK_CLASS } from "@/lib/site";

export function Season() {
  return (
    <section id="now" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 md:px-8 md:py-32">
        <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
          THIS SEASON
        </p>

      <div className="mt-10 grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <div className="max-w-xl">
          <p
            id="decoded"
            className={`${WORDMARK_CLASS} scroll-mt-24 text-2xl text-moon md:text-3xl`}
          >
            dECODED
          </p>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-tight text-moon md:text-5xl">
            The thing we stand on today.
          </h2>
          <p className="mt-6 font-serif text-lg leading-relaxed text-mist">
            Not a coding agent yet. What exists is a localhost proxy that stops
            your agent from re-paying for the same context every turn. Your keys
            stay on your machine.
          </p>
          <Link
            href={PROXY_SITE_URL}
            className="group mt-10 inline-flex items-center gap-3 font-serif text-lg text-gilt transition-colors hover:text-moon"
            style={{ textShadow: "0 2px 14px rgba(8,14,32,0.7)" }}
          >
            <span>know more</span>
            <span
              aria-hidden
              className="inline-block transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>

        <DemoClip instance="season" />
      </div>
    </section>
  );
}
