import Link from "next/link";
import type { ReactNode } from "react";
import { AboutFaq } from "@/components/about/AboutFaq";
import { AudienceSpectrum } from "@/components/about/AudienceSpectrum";
import { BenchmarkBars } from "@/components/about/BenchmarkBars";
import { BrandInterlude } from "@/components/about/BrandInterlude";
import { BuildPanels } from "@/components/about/BuildPanels";
import { ContextTimeline } from "@/components/about/ContextTimeline";
import { DemoSlot } from "@/components/about/DemoSlot";
import { FounderBlock } from "@/components/about/FounderBlock";
import { HackathonFlow } from "@/components/about/HackathonFlow";
import { HarnessBuildAnimation } from "@/components/about/HarnessBuildAnimation";
import { HarnessDiagram } from "@/components/about/HarnessDiagram";
import { ImplementationNote } from "@/components/about/ImplementationNote";
import { MissionSequence } from "@/components/about/MissionSequence";
import { OriginTimeline } from "@/components/about/OriginTimeline";
import { PersonalizedBranches } from "@/components/about/PersonalizedBranches";
import { Reveal } from "@/components/about/Reveal";
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

const OPTIMIZE = [
  {
    word: "Access",
    body: "More people should be able to work with frontier systems.",
  },
  {
    word: "Efficiency",
    body: "Cost and context overhead affect how much people can experiment.",
  },
  {
    word: "Agency",
    body: "The developer should be able to shape the harness around their workflow.",
  },
  {
    word: "Evolution",
    body: "The harness should evolve as models, tools, and workflows change.",
  },
];

const STRIP = [
  { title: "LOCAL-FIRST", body: "The current implementation runs locally." },
  {
    title: "DEVELOPER-OWNED",
    body: "The workflow stays centered around the developer's existing tools.",
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
      {/* WHAT WE BUILD — what UseCoded is */}
      <section
        id="what"
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

        <HarnessBuildAnimation />
      </section>

      <SectionDivider />

      {/* WHY */}
      <Band id="why" tone="deep">
        <p className={EYEBROW}>WHY USECODED EXISTS</p>
        <MissionSequence />
      </Band>

      {/* WHAT WE BUILD */}
      <Band id="builds" tone="sky">
        <p className={EYEBROW}>WHAT USECODED BUILDS</p>
        <h2 className={HEADING}>What UseCoded builds</h2>
        <div className="mt-12">
          <Reveal>
            <BuildPanels />
          </Reveal>
        </div>
      </Band>

      {/* CONTEXT */}
      <Band id="context" tone="deep">
        <p className={EYEBROW}>CONTEXT + TOKEN EFFICIENCY</p>
        <h2 className={HEADING}>Every turn carries history.</h2>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-moon md:text-2xl">
          Your harness decides what deserves to stay.
        </p>
        <ContextTimeline />
      </Band>

      {/* PERSONALIZATION */}
      <Band id="personalized" tone="solid">
        <p className={EYEBROW}>PERSONALIZED</p>
        <h2 className={HEADING}>One harness. Different ways to build.</h2>
        <PersonalizedBranches />
      </Band>

      {/* FIRST SPECIALIZED HARNESS */}
      <Band id="hackathon" tone="sky">
        <p className={EYEBROW}>FIRST SPECIALIZED HARNESS</p>
        <h2 className={HEADING}>Built for hackathons first.</h2>
        <p className={cn("mt-6 max-w-2xl", BODY)}>
          The first specialized UseCoded experience is being shaped around
          hackathon teams: giving a specific group a harness designed around its
          environment, constraints, and workflow.
        </p>
        <div className="mt-14">
          <HackathonFlow />
        </div>
      </Band>

      {/* ORIGIN */}
      <Band id="origin" tone="deep">
        <p className={EYEBROW}>HOW IT STARTED</p>
        <h2 className={HEADING}>How it started</h2>
        <div className="mt-12">
          <OriginTimeline />
        </div>
      </Band>

      {/* WHAT WE'RE OPTIMIZING FOR */}
      <Band id="optimizing" tone="deep">
        <p className={EYEBROW}>WHAT WE’RE OPTIMIZING FOR</p>
        <h2 className={HEADING}>What we’re optimizing for</h2>
        <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {OPTIMIZE.map((item) => (
            <div key={item.word} className="about-activate min-w-0">
              <h3 className="font-serif text-3xl font-medium uppercase tracking-tight text-moon md:text-4xl">
                {item.word}
              </h3>
              <p className="mt-3 font-serif text-[16px] leading-relaxed text-mist">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Band>

      {/* HOW WE THINK */}
      <Band id="principles" tone="sky">
        <p className={EYEBROW}>HOW WE THINK</p>
        <h2 className={cn(HEADING, "text-3xl md:text-4xl")}>
          How we think about the infrastructure
        </h2>
        <div className="mt-10 grid gap-x-8 gap-y-8 md:grid-cols-4">
          {STRIP.map((item) => (
            <div
              key={item.title}
              className="group border-t border-line pt-4 transition-colors hover:border-gilt"
            >
              <h3 className="font-mono text-[12px] tracking-[0.22em] text-gilt">
                {item.title}
              </h3>
              <p className="mt-3 font-serif text-[15px] leading-relaxed text-mist">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Band>

      {/* WHO */}
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

      {/* The single brand interlude */}
      <BrandInterlude />

      {/* FOUNDER */}
      <Band id="built-by" tone="sky">
        <p className={EYEBROW}>BUILT BY</p>
        <h2 className={HEADING}>Built by</h2>
        <div className="mt-10">
          <FounderBlock />
        </div>
      </Band>

      {/* HOW IT WORKS */}
      <Band id="how-it-works" tone="deep">
        <p className={EYEBROW}>HOW USECODED WORKS</p>
        <h2 className={HEADING}>How UseCoded works</h2>
        <div className="mt-12 grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <HarnessDiagram variant="box" />
          <p className="max-w-xl font-serif text-lg leading-relaxed text-mist">
            Requests from your workflow enter the harness, which manages
            context, tools, models, and execution on the way through. The
            result returns along the same path.
          </p>
        </div>
        <ImplementationNote />
      </Band>

      {/* PROOF */}
      <Band id="proof" tone="sky">
        <p className={EYEBROW}>PROOF</p>
        <h2 className={HEADING}>Built to be measured.</h2>
        <BenchmarkBars />
      </Band>

      {/* WHERE */}
      <Band id="roadmap" tone="solid">
        <p className={EYEBROW}>WHERE WE’RE GOING</p>
        <h2 className={HEADING}>Where we’re going</h2>
        <RoadmapPath />
        <p className="mt-10 max-w-2xl font-serif text-[15px] text-dusk">
          Next and Exploring are direction, not shipped functionality. Today and
          the first specialized experience are current.
        </p>
      </Band>

      {/* DEMO */}
      <Band id="demo" tone="sky">
        <p className={EYEBROW}>SEE IT IN ACTION</p>
        <h2 className={HEADING}>See the harness in action</h2>
        <DemoSlot />
      </Band>

      {/* KEY FACTS */}
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

      <AboutFaq />

      {/* Closing */}
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
