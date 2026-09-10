import { DemoClip } from "@/components/landing/DemoClip";
import { HeroInstall } from "@/components/landing/HeroInstall";
import { ScrollLink } from "@/components/landing/ScrollLink";

export function Hero() {
  return (
    <section
      id="start"
      className="relative min-h-[calc(100vh-4.5rem)] scroll-mt-[4.5rem] overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,18,40,0.55) 0%, rgba(10,18,40,0.28) 42%, rgba(10,18,40,0.06) 72%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 md:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] md:px-8 md:py-8">
        <div className="max-w-xl">
          <h1
            className="font-serif text-[2rem] font-medium leading-[1.12] text-[#f7f1e6] sm:text-[2.45rem] md:text-[3.15rem]"
            style={{ textShadow: "0 2px 18px rgba(8,14,32,0.55)" }}
          >
            The coding harness built for token optimization.
          </h1>
          <p className="mt-5 max-w-lg font-serif text-[1.02rem] leading-relaxed text-[#f7f1e6]/84 md:text-[1.08rem]">
            Cuts repeated context so agent runs cost less. Keys stay on your
            machine.
          </p>
          <div className="mt-7">
            <HeroInstall />
          </div>
          <div className="mt-4">
            <ScrollLink
              href="/#how"
              className="font-serif text-sm text-[#f7f1e6]/70 transition-colors hover:text-[#f7f1e6]"
            >
              How it works
            </ScrollLink>
          </div>
        </div>
        <DemoClip className="md:min-w-0" />
      </div>
    </section>
  );
}
