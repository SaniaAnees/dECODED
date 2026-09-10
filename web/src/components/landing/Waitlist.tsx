import { BetaForm } from "@/components/landing/BetaForm";

export function Waitlist() {
  return (
    <section id="waitlist" className="mx-auto max-w-5xl scroll-mt-[4.5rem] px-6 py-8 md:px-8">
      <hr className="rule" />
      <div className="py-24 md:py-32">
        <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
          UPDATES
        </p>
        <h2 className="mt-5 max-w-xl font-serif text-4xl font-medium leading-tight text-moon md:text-5xl">
          Updates and early features.
        </h2>
        <p className="mt-6 max-w-lg font-serif text-lg leading-relaxed text-mist">
          Install is the main path. Leave an email only if you want occasional
          notes when there is something real to ship or test.
        </p>
        <div className="mt-10">
          <BetaForm submitLabel="Get updates" success={"You're on the updates list."} />
        </div>
      </div>
    </section>
  );
}
