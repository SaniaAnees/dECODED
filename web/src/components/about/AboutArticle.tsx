import Link from "next/link";
import type { ReactNode } from "react";
import { AboutFaq } from "@/components/about/AboutFaq";
import { AudienceSpectrum } from "@/components/about/AudienceSpectrum";
import { BuildPanels } from "@/components/about/BuildPanels";
import { DemoSlot } from "@/components/about/DemoSlot";
import { HackathonFlow } from "@/components/about/HackathonFlow";
import { HarnessDiagram } from "@/components/about/HarnessDiagram";
import { ImplementationNote } from "@/components/about/ImplementationNote";
import { OriginTimeline } from "@/components/about/OriginTimeline";
import { Reveal } from "@/components/about/Reveal";
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

const WHY_CONCEPTS = [
  {
    word: "Access",
    body: "Lower practical barriers of cost and complexity.",
  },
  {
    word: "Efficiency",
    body: "Make advanced AI development more economical to run and iterate.",
  },
  {
    word: "Personalization",
    body: "Let the harness adapt to the person and workflow.",
  },
];

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

const INTERESTS = ["AI SYSTEMS", "MULTI-AGENT WORKFLOWS", "CUDA", "RUST", "GO"];

const ROADMAP = [
  {
    stage: "Today",
    tone: "now" as const,
    items: [
      "AI coding harness",
      "Personalized harnesses",
      "Context + token efficiency",
    ],
  },
  {
    stage: "First specialized experience",
    tone: "now" as const,
    items: ["Hackathon Harness"],
  },
  {
    stage: "Next",
    tone: "later" as const,
    items: [
      "More workflow-specific harnesses",
      "More user-specific environments",
      "Broader agentic workflows",
    ],
  },
  {
    stage: "Exploring",
    tone: "later" as const,
    items: ["Research", "Automation", "Other personalized AI workflows"],
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
      {/* Why */}
      <Band id="why" tone="sky">
        <p className={EYEBROW}>WHY USECODED EXISTS</p>
        <Reveal>
          <h2 className="mt-6 max-w-4xl font-serif text-[1.75rem] font-medium uppercase leading-[1.15] tracking-tight text-moon sm:text-[2.25rem] md:text-[2.9rem]">
            More people should be able to build with frontier technology.
          </h2>
        </Reveal>

        <div className="mt-14 divide-y divide-line border-y border-line">
          {WHY_CONCEPTS.map((concept) => (
            <div
              key={concept.word}
              className="about-activate grid gap-3 py-8 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:items-baseline md:gap-12"
            >
              <h3 className="font-serif text-2xl font-medium uppercase tracking-tight text-moon md:text-3xl">
                {concept.word}
              </h3>
              <p className="font-serif text-[17px] leading-relaxed text-mist">
                {concept.body}
              </p>
            </div>
          ))}
        </div>

        <Reveal className="mt-14 max-w-2xl">
          <p className="font-serif text-lg italic leading-relaxed text-moon">
            I want more people to be able to build with frontier technology. Not
            only the ones who can already absorb the cost, or whose workflow
            happens to match the default.
          </p>
        </Reveal>
      </Band>

      {/* What UseCoded builds */}
      <Band id="builds" tone="deep">
        <p className={EYEBROW}>WHAT USECODED BUILDS</p>
        <h2 className={HEADING}>What UseCoded builds</h2>
        <div className="mt-12">
          <Reveal>
            <BuildPanels />
          </Reveal>
        </div>
      </Band>

      {/* Hackathon harness */}
      <Band id="hackathon" tone="sky">
        <p className={EYEBROW}>FIRST SPECIALIZED HARNESS</p>
        <h2 className={HEADING}>Built for hackathons first.</h2>
        <p className={cn("mt-6 max-w-2xl", BODY)}>
          The first specialized UseCoded experience is being shaped around
          hackathon teams: giving a specific group a harness designed around its
          environment, constraints, and workflow.
        </p>
        <Reveal className="mt-14">
          <HackathonFlow />
        </Reveal>
      </Band>

      {/* What we're optimizing for */}
      <Band id="optimizing" tone="solid">
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

      {/* Who we're building for */}
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

      {/* Origin */}
      <Band id="origin" tone="deep">
        <p className={EYEBROW}>HOW IT STARTED</p>
        <h2 className={HEADING}>How it started</h2>
        <div className="mt-12">
          <OriginTimeline />
        </div>
      </Band>

      {/* Founder */}
      <Band id="built-by" tone="sky">
        <p className={EYEBROW}>BUILT BY</p>
        <h2 className={HEADING}>Built by</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-14">
          <div>
            <h3 className="font-serif text-3xl font-medium text-moon">
              {FOUNDER.name}
            </h3>
            <p className="mt-2 font-mono text-[11px] tracking-[0.2em] text-gilt">
              {FOUNDER.title.toUpperCase()}, USECODED
            </p>
            <SocialList
              accounts={FOUNDER.socials}
              className="mt-6 flex-col items-start gap-3"
            />
          </div>
          <div>
            <blockquote className="font-serif text-xl italic leading-relaxed text-moon md:text-2xl">
              “I want more people around the world to be able to build with
              frontier technology without complexity or cost becoming the
              barrier.”
            </blockquote>
            <p className="mt-6 font-serif text-[16px] leading-relaxed text-mist">
              I care about systems optimisation and try to apply that mindset
              wherever it helps. My interests sit across AI systems,
              multi-agent workflows, and low-level systems. Right now I’m
              spending most of my time working with frontier models while
              strengthening my fundamentals across areas such as CUDA, Rust,
              and Go.
            </p>
          </div>
        </div>

        <ul
          aria-label="Areas of interest"
          className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line pt-6"
        >
          {INTERESTS.map((label, index) => (
            <li
              key={label}
              className="about-tick font-mono text-[11px] tracking-[0.22em] text-mist"
              style={{ animationDelay: `${index * 0.6}s` }}
            >
              {label}
            </li>
          ))}
        </ul>
      </Band>

      {/* How it works */}
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

      {/* Roadmap */}
      <Band id="roadmap" tone="sky">
        <p className={EYEBROW}>WHERE WE’RE GOING</p>
        <h2 className={HEADING}>Where we’re going</h2>
        <div className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
          {ROADMAP.map((group) => (
            <div
              key={group.stage}
              className="about-activate border-t border-line pt-4"
            >
              <h3
                className={cn(
                  "font-mono text-[11px] font-normal tracking-[0.2em]",
                  group.tone === "now" ? "text-gilt" : "text-dusk",
                )}
              >
                {group.stage.toUpperCase()}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 font-serif text-[15px] leading-snug text-mist"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-[0.5em] h-1 w-1 shrink-0 rounded-full",
                        group.tone === "now" ? "bg-gilt/80" : "bg-dusk/70",
                      )}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-2xl font-serif text-[15px] text-dusk">
          Next and Exploring are direction, not shipped functionality. Today and
          the first specialized experience are current.
        </p>
      </Band>

      {/* Demo */}
      <Band id="demo" tone="solid">
        <p className={EYEBROW}>SEE IT IN ACTION</p>
        <h2 className={HEADING}>See the harness in action</h2>
        <DemoSlot />
      </Band>

      {/* Key facts */}
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
      className={cn(
        "scroll-mt-[4.5rem] border-t border-line",
        BAND[tone],
      )}
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
