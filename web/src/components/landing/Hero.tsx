import Image from "next/image";
import { BetaForm } from "@/components/landing/BetaForm";

export function Hero() {
  return (
    <section id="hero" className="relative min-h-[92vh] overflow-hidden">
      <Image
        src="/sky.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="sky-print object-cover object-[50%_40%]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,18,40,0.72) 0%, rgba(10,18,40,0.42) 42%, rgba(10,18,40,0.08) 72%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto grid min-h-[92vh] max-w-6xl grid-cols-1 items-center px-6 py-28 md:grid-cols-2 md:px-8 md:py-0">
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
          <div id="start" className="mt-10 scroll-mt-28">
            <BetaForm variant="hero" />
          </div>
        </div>
        <div aria-hidden className="hidden md:block" />
      </div>
    </section>
  );
}
