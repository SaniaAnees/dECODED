import Link from "next/link";
import { DemoClip } from "@/components/landing/DemoClip";
import { PROXY_PATH, WORDMARK_CLASS } from "@/lib/site";

export function Season() {
  return (
    <section
      id="product"
      className="mx-auto max-w-6xl scroll-mt-[4.5rem] px-6 py-24 md:px-8 md:py-32"
    >
      <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
        PRODUCT
      </p>

      <div className="mt-10 grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <div className="max-w-xl">
          <p className={`${WORDMARK_CLASS} text-2xl text-moon md:text-3xl`}>
            usecoded
          </p>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-tight text-moon md:text-5xl">
            Built for the part of agentic coding that keeps billing twice.
          </h2>
          <p className="mt-6 font-serif text-lg leading-relaxed text-mist">
            Stable prefixes matter. usecoded keeps request shape clean enough for
            provider cache to hit, without moving your keys or prompts into a
            hosted relay we control.
          </p>
          <div
            id="how"
            className="mt-10 grid gap-4 rounded-[1.25rem] border border-line bg-ink/55 p-5 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center"
          >
            <Node
              eyebrow="Agent"
              title="Your coding agent"
              body="Claude Code, OpenAI-compatible tooling, or the harness you already run."
            />
            <Arrow />
            <Node
              eyebrow="usecoded"
              title="On your machine"
              body="Normalizes request shape, preserves repeatable prefix bytes, and serves localhost."
            />
            <Arrow />
            <Node
              eyebrow="Provider"
              title="Your provider"
              body="Forwards to the lab you choose, with the key you already own."
            />
          </div>
          <p className="mt-6 max-w-lg font-serif text-base leading-relaxed text-mist">
            Proof stays inspectable: the live demo shows cache-visible runs on
            Mistral, and the proxy exposes local stats so you can verify behavior
            instead of taking a savings claim on faith.
          </p>
          <Link
            href={PROXY_PATH}
            className="group mt-10 inline-flex items-center gap-3 font-serif text-lg text-gilt transition-colors hover:text-moon"
            style={{ textShadow: "0 2px 14px rgba(8,14,32,0.7)" }}
          >
            <span>Proxy docs</span>
            <span
              aria-hidden
              className="inline-block transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>

        <DemoClip lazy />
      </div>
    </section>
  );
}

function Node({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <article className="min-w-0">
      <p className="font-mono text-[11px] tracking-[0.18em] text-gilt">{eyebrow}</p>
      <h3 className="mt-2 font-serif text-xl italic text-moon">{title}</h3>
      <p className="mt-2 font-serif text-[16px] leading-relaxed text-mist">
        {body}
      </p>
    </article>
  );
}

function Arrow() {
  return (
    <div
      aria-hidden
      className="hidden justify-center font-mono text-lg text-gilt/70 md:flex"
    >
      →
    </div>
  );
}
