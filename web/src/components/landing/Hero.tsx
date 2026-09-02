import Image from "next/image";

export function Hero() {
  return (
    <section id="hero" className="relative min-h-[92vh] overflow-hidden">
      <Image
        src="/sky.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[50%_40%]"
      />
      {/* Slight darkening at the top so the header and headline read on the blue. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(16,34,78,0.42) 0%, rgba(16,34,78,0.12) 38%, rgba(16,34,78,0) 60%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[92vh] max-w-3xl flex-col items-center px-6 pt-36 text-center md:px-8 md:pt-44">
        <p className="font-mono text-[11px] tracking-[0.28em] text-white/80">
          VOL. I · THIS SEASON
        </p>
        <h1
          className="mt-7 font-serif text-[2.6rem] font-medium leading-[1.14] text-white sm:text-6xl md:text-[4.25rem]"
          style={{ textShadow: "0 2px 24px rgba(16,34,78,0.35)" }}
        >
          Coding agents waste tokens.
          <span className="mt-3 block font-normal italic text-white/90">
            We&apos;re building one that doesn&apos;t.
          </span>
        </h1>
        <p
          className="mt-8 max-w-xl font-serif text-lg leading-relaxed text-white/90 md:text-xl"
          style={{ textShadow: "0 1px 14px rgba(16,34,78,0.35)" }}
        >
          The first layer exists: a local prefix cache and a normalizer. The
          agent itself is next.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#start"
            className="bg-moon px-6 py-3 font-serif text-[15px] text-white transition-opacity hover:opacity-90"
          >
            Join the list
          </a>
          <a
            href="#now"
            className="border border-white/60 bg-white/10 px-6 py-3 font-serif text-[15px] text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            What exists
          </a>
        </div>
      </div>
    </section>
  );
}
