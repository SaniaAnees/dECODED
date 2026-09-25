import Link from "next/link";
import type { ReactNode } from "react";
import { AboutFaq } from "@/components/about/AboutFaq";
import { AudienceSpectrum } from "@/components/about/AudienceSpectrum";
import { BenchmarkBars } from "@/components/about/BenchmarkBars";
import { DemoSlot } from "@/components/about/DemoSlot";
import { FounderBlock } from "@/components/about/FounderBlock";
import { HackathonFlow } from "@/components/about/HackathonFlow";
import { HarnessDiagram } from "@/components/about/HarnessDiagram";
import { HarnessSystemAnimation } from "@/components/about/HarnessSystemAnimation";
import { ImplementationNote } from "@/components/about/ImplementationNote";
import { MissionSequence } from "@/components/about/MissionSequence";
import { OriginTimeline } from "@/components/about/OriginTimeline";
import { PersonalizedBranches } from "@/components/about/PersonalizedBranches";
import { RoadmapPath } from "@/components/about/RoadmapPath";
import { SectionDivider } from "@/components/about/SectionDivider";
import { SocialList } from "@/components/about/SocialLinks";
import { cn } from "@/lib/utils";
import {
  COMPANY_SOCIALS,
  FOUNDER,
  PAYMENT_PROVIDER,
  PLAN_FREE,
  PLAN_PAID,
  PROD_URLS,
  SIGN_IN_URL,
} from "@/lib/site";

const EYEBROW = "font-mono text-[11px] tracking-[0.28em] text-gilt";
const HEADING =
  "mt-5 font-serif text-4xl font-medium leading-tight text-moon md:text-5xl";
const BODY = "font-serif text-lg leading-relaxed text-mist";
const BTN_PRIMARY =
  "inline-flex h-11 items-center justify-center rounded-md border border-gilt/60 bg-gilt/15 px-6 font-serif text-[16px] text-moon transition-colors hover:border-gilt hover:bg-gilt/25";
const BTN_SECONDARY =
  "inline-flex h-11 items-center justify-center rounded-md border border-line bg-transparent px-6 font-serif text-[16px] text-moon transition-colors hover:border-gilt/50 hover:bg-ink/40";

/** Technical foundations. Owned by the "how it works" section. */
const FOUNDATIONS = [
  { title: "LOCAL-FIRST", body: "The current implementation runs locally." },
  {
    title: "DEVELOPER-OWNED",
    body: "The workflow stays centered around the tools you already use.",
  },
  {
    title: "VISIBLE",
    body: "Usage, tokens, caching, and execution behavior should be inspectable.",
  },
  {
    title: "EVOLVING",
    body: "The harness should adapt as models, agents, and workflows change.",
  },
];

const BAND = {
  sky: "",
  deep: "about-band-deep",
  solid: "about-band-solid",
} as const;

export function AboutArticle() {
  return (
    <>
      {/* 3 — PRODUCT: what the harness actually does */}
      <section
        id="product"
        className="about-band-solid scroll-mt-[4.5rem] border-t border-line"
      >
        <div className="mx-auto max-w-5xl px-6 pt-16 md:px-8 md:pt-24">
          <p className={EYEBROW}>WHAT WE BUILD</p>
          <h2 className={HEADING}>
            An AI coding harness built around the way you build.
          </h2>
          <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-mist">
            UseCoded brings the context, tools, models, and workflow around an
            AI-assisted coding session into a layer that can be shaped around
            the way you work.
          </p>
        </div>

        <HarnessSystemAnimation />
      </section>

      <SectionDivider />

      {/* 2 — WHY: the problem */}
      <Band id="why" tone="deep">
        <p className={EYEBROW}>WHY USECODED EXISTS</p>
        <MissionSequence />
      </Band>

      {/* 4 — PERSONALIZATION, with the first specialized harness */}
      <Band id="personalized" tone="solid">
        <p className={EYEBROW}>PERSONALIZED HARNESSES</p>
        <h2 className={HEADING}>One harness. Different ways to build.</h2>
        <p className={cn("mt-6 max-w-2xl", BODY)}>
          Different workflows need different harness behaviour. The same harness
          can be shaped around the environment, constraints, and goals of a
          particular kind of work.
        </p>

        <PersonalizedBranches />

        <div className="mt-16 border-t border-line pt-12">
          <p className={EYEBROW}>FIRST SPECIALIZED HARNESS</p>
          <h3 className="mt-5 font-serif text-3xl font-medium leading-tight text-moon md:text-4xl">
            Built for hackathons first.
          </h3>
          <p className="mt-5 max-w-2xl font-serif text-[16px] leading-relaxed text-mist">
            The first specialized harness is being shaped around hackathon
            teams: a harness designed around that environment, its constraints,
            and its workflow.
          </p>
          <div className="mt-12">
            <HackathonFlow />
          </div>
        </div>
      </Band>

      {/* 5 — WHO */}
      <Band id="audience" tone="sky">
        <p className={EYEBROW}>WHO USECODED IS FOR</p>
        <h2 className={HEADING}>Who we’re building for</h2>
      </Band>
      <div className="mx-auto max-w-6xl">
        <AudienceSpectrum />
      </div>
      <div className="mx-auto max-w-5xl px-6 pb-16 md:px-8 md:pb-24">
        <p className="max-w-2xl font-serif text-lg leading-relaxed text-mist">
          UseCoded starts with AI-assisted software development and expands
          toward students, hackathon teams, and increasingly personalized
          workflows.
        </p>
        <p className="mt-4 font-serif text-[15px] text-dusk">
          These are intended audiences, not a customer list.
        </p>
      </div>

      {/* 6 — FOUNDER */}
      <Band id="built-by" tone="sky">
        <p className={EYEBROW}>BUILT BY</p>
        <h2 className={HEADING}>Built by</h2>
        <div className="mt-10">
          <FounderBlock />
        </div>
      </Band>

      {/* 7 — ORIGIN: the only home for the proxy and normalizer */}
      <Band id="origin" tone="deep">
        <p className={EYEBROW}>HOW IT STARTED</p>
        <h2 className={HEADING}>How it started</h2>
        <p className={cn("mt-5 max-w-2xl", BODY)}>
          UseCoded was not planned as a product from day one. The infrastructure
          came first, and that work became the foundation for the harness.
        </p>
        <div className="mt-12">
          <OriginTimeline />
        </div>
      </Band>

      {/* 8 — TECHNICAL: how it is structured */}
      <Band id="how-it-works" tone="deep">
        <p className={EYEBROW}>HOW USECODED WORKS</p>
        <h2 className={HEADING}>How UseCoded works</h2>
        <div className="mt-12 grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <HarnessDiagram variant="box" />
          <p className="max-w-xl font-serif text-lg leading-relaxed text-mist">
            Requests from your workflow enter the harness, which manages
            context, tools, models, and execution on the way through. The result
            returns along the same path.
          </p>
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-8 md:grid-cols-4">
          {FOUNDATIONS.map((item) => (
            <div key={item.title} className="border-t border-line pt-4">
              <h3 className="font-mono text-[12px] tracking-[0.22em] text-gilt">
                {item.title}
              </h3>
              <p className="mt-3 font-serif text-[15px] leading-relaxed text-mist">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <ImplementationNote />
      </Band>

      {/* PROOF — the only place with measured data */}
      <Band id="proof" tone="sky">
        <p className={EYEBROW}>PROOF</p>
        <h2 className={HEADING}>Built to be measured.</h2>
        <BenchmarkBars />
      </Band>

      {/* 9 — WHERE */}
      <Band id="roadmap" tone="solid">
        <p className={EYEBROW}>WHERE WE’RE GOING</p>
        <h2 className={HEADING}>Where we’re going</h2>
        <RoadmapPath />
        <p className="mt-10 max-w-2xl font-serif text-[15px] text-dusk">
          Next and Exploring are direction, not shipped functionality. Today and
          the first specialized experience are current.
        </p>
      </Band>

      <Band id="demo" tone="sky">
        <p className={EYEBROW}>SEE IT IN ACTION</p>
        <h2 className={HEADING}>See the harness in action</h2>
        <DemoSlot />
      </Band>

      {/* 10 — KEY FACTS */}
      <Band id="facts" tone="sky">
        <p className={EYEBROW}>KEY FACTS</p>
        <h2 className={HEADING}>Key facts</h2>
        <div className="mt-10 border border-line">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Established facts about UseCoded
            </caption>
            <tbody className="divide-y divide-line">
              <FactRow label="COMPANY">UseCoded</FactRow>
              <FactRow label="TYPE">
                AI coding harness / developer infrastructure
              </FactRow>
              <FactRow label="FOUNDED">2026</FactRow>
              <FactRow label="FOUNDER">{FOUNDER.name}</FactRow>
              <FactRow label="WEBSITE">
                <a
                  href={PROD_URLS.main}
                  className="text-gilt underline-offset-4 transition-colors hover:text-moon hover:underline"
                >
                  usecoded.com
                </a>
              </FactRow>
              <FactRow label="CORE OFFERING">
                AI coding harness and context/token optimization infrastructure
              </FactRow>
              <FactRow label="CURRENT SPECIALIZED EXPERIENCE">
                Hackathon Harness
              </FactRow>
              <FactRow label="PRIMARY AUDIENCE">
                Developers, builders, engineering teams, students, and
                hackathon users
              </FactRow>
              <FactRow label="PRICING">
                {`${PLAN_FREE.name} ${PLAN_FREE.priceLabel} and ${PLAN_PAID.name} ${PLAN_PAID.priceLabel}/month, billed via ${PAYMENT_PROVIDER}`}
              </FactRow>
              <FactRow label="SOCIAL">
                <SocialList accounts={COMPANY_SOCIALS} />
              </FactRow>
            </tbody>
          </table>
        </div>
      </Band>

      {/* 11 — FAQ */}
      <AboutFaq />

      {/* 12 — CTA */}
      <Band id="start" tone="solid">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-mono text-[13px] tracking-[0.34em] text-gilt md:text-[15px]">
            BUILD AT THE EDGE.
          </h2>
          <p className="mt-6 font-serif text-lg leading-relaxed text-mist">
            UseCoded is being built for people who want to experiment, build,
            and work with increasingly capable AI systems without unnecessary
            cost and complexity becoming the barrier.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a href={SIGN_IN_URL} className={BTN_PRIMARY}>
              Get Started
            </a>
            <Link href="/#product" className={BTN_SECONDARY}>
              Explore the Product
            </Link>
          </div>
        </div>
      </Band>
    </>
  );
}

function Band({
  id,
  tone = "sky",
  children,
}: {
  id?: string;
  tone?: keyof typeof BAND;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-[4.5rem] border-t border-line", BAND[tone])}
    >
      <div className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-24">
        {children}
      </div>
    </section>
  );
}

function FactRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <tr className="align-top">
      <th
        scope="row"
        className="w-32 px-5 py-4 text-left align-top font-mono text-[10px] font-normal tracking-[0.16em] text-gilt sm:w-64 md:px-6"
      >
        {label}
      </th>
      <td className="break-words px-5 py-4 font-serif text-[16px] leading-relaxed text-mist md:px-6">
        {children}
      </td>
    </tr>
  );
}
