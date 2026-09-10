import type { ReactNode } from "react";
import { CONTACT_EMAIL } from "@/lib/site";

type LegalDocProps = {
  eyebrow: string;
  title: string;
  lead: string;
  updated: string;
  children: ReactNode;
  contactExtra?: ReactNode;
};

export function LegalDoc({
  eyebrow,
  title,
  lead,
  updated,
  children,
  contactExtra,
}: LegalDocProps) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-8 md:py-24">
      <article className="legal-doc rounded-[1.25rem] px-7 py-10 sm:px-9 sm:py-11 md:px-11 md:py-12">
        <header className="border-b border-line pb-8">
          <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-tight tracking-tight text-moon md:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-5 max-w-lg font-serif text-lg leading-relaxed text-mist">
            {lead}
          </p>
          <p className="mt-5 font-mono text-[11px] tracking-[0.12em] text-dusk">
            Last updated {updated}
          </p>
        </header>

        <div className="divide-y divide-line">{children}</div>

        <footer className="mt-2 border-t border-line pt-10">
          <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
            CONTACT
          </p>
          <p className="mt-3 font-serif text-[16px] leading-relaxed text-mist">
            Sania Anees
            <br />
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-gilt underline-offset-4 transition-colors hover:text-moon hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            {contactExtra}
          </p>
        </footer>
      </article>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-7 first:pt-9 last:pb-1">
      <h2 className="font-serif text-xl font-medium leading-snug text-moon md:text-[1.35rem]">
        {title}
      </h2>
      <div className="mt-3 space-y-3 font-serif text-[16px] leading-[1.65] text-mist [&_a]:text-gilt [&_a]:underline-offset-4 [&_a]:transition-colors hover:[&_a]:text-moon hover:[&_a]:underline [&_strong]:font-medium [&_strong]:text-moon">
        {children}
      </div>
    </section>
  );
}
