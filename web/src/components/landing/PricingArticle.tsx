import type { ReactNode } from "react";
import { PricingCheckoutActions, StartFreeButton } from "@/components/landing/PricingCheckoutActions";
import { PricingFaq } from "@/components/landing/PricingFaq";
import { PAYMENT_PROVIDER, PLAN_FREE, PLAN_PAID } from "@/lib/site";

const freeIncludes = [
  "No credit card required",
  "CLI access",
  "Auto and free models",
  "Limited agent usage",
];

const proIncludes = [
  "Extended limits",
  "Access to more models",
  "Priority access to new features",
];

export function PricingArticle() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-6 pb-8 pt-16 md:px-8 md:pb-10 md:pt-24">
        <header className="mx-auto max-w-2xl text-center">
          <h1
            className="font-serif text-4xl font-medium tracking-tight text-moon md:text-5xl"
            style={{ textShadow: "0 2px 18px rgba(8,14,32,0.45)" }}
          >
            Pricing
          </h1>
          <p className="mt-5 font-serif text-lg leading-relaxed text-mist md:text-xl">
            The usecoded harness for agentic coding.
          </p>
        </header>

        <div className="mt-14 grid grid-cols-1 gap-5 md:mt-16 md:grid-cols-2 md:gap-6">
          <PlanCard
            name={PLAN_FREE.name}
            price={PLAN_FREE.priceLabel}
            blurb="For getting started."
            includesLabel="Includes"
            includes={freeIncludes}
            variant="free"
            action={<StartFreeButton />}
          />
          <PlanCard
            name={PLAN_PAID.name}
            price={`${PLAN_PAID.priceLabel} / mo.`}
            blurb="For daily agentic coding."
            includesLabel="Everything in Free, plus"
            includes={proIncludes}
            variant="pro"
            action={<PricingCheckoutActions />}
          />
        </div>

        <p className="mt-8 text-center font-serif text-sm leading-relaxed text-dusk md:mt-10">
          Billed via {PAYMENT_PROVIDER}. Prices in USD. Checkout charges INR at
          your Razorpay plan rate.
        </p>
      </section>

      <PricingFaq />
    </>
  );
}

function PlanCard({
  name,
  price,
  blurb,
  includesLabel,
  includes,
  variant,
  action,
}: {
  name: string;
  price: string;
  blurb: string;
  includesLabel: string;
  includes: string[];
  variant: "free" | "pro";
  action: ReactNode;
}) {
  const isPro = variant === "pro";

  return (
    <article
      className={
        isPro
          ? "pricing-card pricing-card--pro flex flex-col rounded-2xl border border-gilt/35 bg-ink/60 px-7 py-8 sm:px-8 sm:py-9"
          : "pricing-card flex flex-col rounded-2xl border border-line bg-ink/45 px-7 py-8 sm:px-8 sm:py-9"
      }
    >
      <h2 className="font-serif text-xl font-medium text-moon md:text-2xl">
        {name}
      </h2>
      <p className="mt-2 font-serif text-[16px] leading-relaxed text-mist">
        {blurb}
      </p>

      <p className="mt-8 font-serif text-4xl font-medium tracking-tight text-moon md:text-[2.75rem]">
        {price}
      </p>

      <div className="mt-6">{action}</div>

      <div className="mt-8 flex-1 border-t border-line pt-7">
        <p className="font-serif text-[15px] text-mist">{includesLabel}:</p>
        <ul className="mt-4 space-y-3">
          {includes.map((item) => (
            <li
              key={item}
              className="flex gap-3 font-serif text-[16px] leading-snug text-mist"
            >
              <span aria-hidden className="mt-0.5 shrink-0 text-gilt">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
