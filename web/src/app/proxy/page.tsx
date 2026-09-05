import type { Metadata } from "next";
import { existsSync } from "node:fs";
import path from "node:path";
import { LiveGif } from "@/components/landing/LiveGif";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
import { AgentShell } from "@/components/proxy/AgentShell";
import { InstallRow } from "@/components/proxy/InstallRow";
import { ProxyHeader } from "@/components/proxy/ProxyHeader";

export const metadata: Metadata = {
  title: "know more",
};

export default function ProxyPage() {
  const proofGif = path.join(process.cwd(), "public", "mistral-cache.gif");
  const hasProofGif = existsSync(proofGif);

  return (
    <SkyPageShell>
      <ProxyHeader />

      <main className="sky-scroll relative z-10">
        <section className="mx-auto max-w-6xl px-6 pb-2 pt-8 md:px-8 md:pt-10">
          <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">START HERE</p>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl font-medium leading-tight text-moon md:text-5xl">
            Install. Start the proxy. Point your agent at localhost.
          </h1>
          <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-mist">
            Two commands per platform. Leave that terminal running — it is the
            PAYG proxy on{" "}
            <span className="font-mono text-[15px] text-moon/90">127.0.0.1:8080</span>.
            Your agent runs in a second window.
          </p>
        </section>

        <section
          id="install"
          className="scroll-mt-24 px-6 pb-16 pt-8 md:px-8 md:pb-24 md:pt-10 lg:px-12"
        >
          <InstallRow />
          <div className="mx-auto mt-10 max-w-6xl">
            <AgentShell />
          </div>
        </section>

        <hr className="rule mx-8 lg:mx-12" />

        <section
          id="what-it-does"
          className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 md:px-8 md:py-24"
        >
          <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">WHAT IT DOES</p>
          <h2 className="mt-5 max-w-2xl font-serif text-3xl font-medium leading-tight text-moon md:text-4xl">
            Stop paying twice for the same prompt.
          </h2>
          <p className="mt-8 max-w-2xl font-serif text-lg leading-relaxed text-mist">
            Agents send the same system prompt every turn. Wrayle keeps it stable
            on localhost so cache can hit. Nothing leaves your machine except the
            request to your provider.
          </p>
        </section>

        <hr className="rule mx-8 lg:mx-12" />

        <section
          id="proof"
          className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 md:px-8 md:py-24 md:pb-28"
        >
          <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">PROOF OF WORK</p>
          <h2 className="mt-5 max-w-2xl font-serif text-3xl font-medium leading-tight text-moon md:text-4xl">
            Cache hits you can inspect.
          </h2>
          <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-mist">
            Mistral probe through localhost — proxy on the left, turns on the
            right. Hit rate shows up on{" "}
            <span className="font-mono text-[15px] text-moon/90">
              curl -s localhost:8080/stats
            </span>
            .
          </p>
          {hasProofGif ? (
            <LiveGif
              src="/mistral-cache.gif?v=3"
              alt="Windows PowerShell: decoded proxy on the left, Mistral cache probe on the right"
              className="mt-10 w-full rounded-lg border border-line shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
              width={960}
              height={640}
            />
          ) : null}
        </section>
      </main>
    </SkyPageShell>
  );
}
