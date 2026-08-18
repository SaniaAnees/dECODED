import { BetaForm } from "@/components/landing/BetaForm";
import { CopyCommand } from "@/components/landing/CopyCommand";

export function Hero() {
  return (
    <section id="hero" className="mx-auto max-w-5xl px-6 pt-16 pb-8 md:pt-24 md:pb-12">
      <p className="text-sm text-muted">Private beta</p>

      <h1 className="mt-5 max-w-3xl text-[2rem] font-semibold leading-[1.15] tracking-tight text-heading md:text-5xl md:leading-[1.12]">
        <span className="block">10x Faster Agents.</span>
        <span className="block">70% Cheaper API Bills.</span>
        <span className="block">Zero Context Loss.</span>
      </h1>

      <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
        Prefix-cached proxy for AI coding agents. Stop context drift and
        maximize KV-cache hits with a 1-line setup.
      </p>

      <div className="mt-10 space-y-3">
        <CopyCommand />
        <div id="beta" className="scroll-mt-20">
          <BetaForm />
        </div>
      </div>
    </section>
  );
}
