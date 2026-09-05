import { BetaForm } from "@/components/landing/BetaForm";
import { DemoClip } from "@/components/landing/DemoClip";

export function Hero() {
  return (
    <section id="hero" className="relative min-h-[92vh] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,18,40,0.55) 0%, rgba(10,18,40,0.28) 42%, rgba(10,18,40,0.06) 72%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-[92vh] max-w-6xl grid-cols-1 items-center px-6 py-12 md:grid-cols-2 md:px-8 md:py-0">
        <div className="max-w-xl">
          <h1
            className="font-serif text-[1.85rem] font-medium leading-[1.2] text-[#f7f1e6] sm:text-4xl md:text-[2.35rem]"
            style={{ textShadow: "0 2px 18px rgba(8,14,32,0.55)" }}
          >
            Coding agents waste tokens.
            <span className="mt-3 block font-normal italic text-[#f7f1e6]/92">
              We&apos;re building one that doesn&apos;t.
            </span>
          </h1>
          <div id="start" className="mt-10">
            <BetaForm variant="hero" />
          </div>
        </div>
        <DemoClip instance="hero" />
      </div>
    </section>
  );
}
