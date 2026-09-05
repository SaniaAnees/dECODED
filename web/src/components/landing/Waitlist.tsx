import { BetaForm } from "@/components/landing/BetaForm";

export function Waitlist() {
  return (
    <section id="start" className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <hr className="rule" />
      <div className="py-24 md:py-32">
        <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
          THE LIST
        </p>
        <h2 className="mt-5 max-w-xl font-serif text-4xl font-medium leading-tight text-moon md:text-5xl">
          Leave an email if the problem is yours too.
        </h2>
        <p className="mt-6 max-w-lg font-serif text-lg leading-relaxed text-mist">
          No quiz. No sales call. We will write when there is something true
          to send — the cache layer, or the harness, when it exists.
        </p>
        <div className="mt-10">
          <BetaForm />
        </div>
      </div>
    </section>
  );
}
