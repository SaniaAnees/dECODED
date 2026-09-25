import { HarnessDiagram } from "@/components/about/HarnessDiagram";
import { Wordmark } from "@/components/landing/Wordmark";

const LINES = ["Build", "at the edge", "of technology"];
const LINE_STAGGER_MS = 320;
const WORD_STAGGER_MS = 110;
const MARK_DELAY_MS = 1500;

/**
 * Top of the About page. A clean dark surface, no sky and no plane: the
 * company statement, a word-by-word reveal resolving into the UseCoded mark,
 * then the harness architecture.
 */
export function AboutHero() {
  return (
    <section className="relative bg-[#0a1228]">
      <div className="mx-auto max-w-5xl px-6 pb-14 pt-10 md:px-8 md:pt-16">
        <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
          ABOUT USECODED
        </p>
        <h1 className="mt-5 max-w-3xl font-serif text-[2.1rem] font-medium leading-[1.1] text-[#f7f1e6] sm:text-[2.6rem] md:text-[3.1rem]">
          Build at the edge of technology.
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-[1.05rem] leading-relaxed text-[#f7f1e6]/80">
          UseCoded is building AI coding harnesses that make advanced AI
          development more accessible, efficient, and personalizable.
        </p>
        <p className="mt-5 font-mono text-[11px] tracking-[0.14em] text-dusk">
          Coding · Hackathons · Personalized workflows
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-20 pt-10 md:px-8 md:pb-24 md:pt-14">
        <div
          aria-hidden
          className="font-serif text-[2.25rem] font-medium uppercase leading-[1.04] tracking-tight text-[#f7f1e6] md:text-[4rem]"
        >
          {LINES.map((line, lineIndex) => (
            <p key={line}>
              {line.split(" ").map((word, wordIndex) => (
                <span
                  key={`${word}-${wordIndex}`}
                  className="about-hero-word mr-[0.22em] inline-block"
                  style={{
                    animationDelay: `${
                      lineIndex * LINE_STAGGER_MS + wordIndex * WORD_STAGGER_MS
                    }ms`,
                  }}
                >
                  {word}
                </span>
              ))}
            </p>
          ))}
        </div>

        <div
          className="about-hero-mark mt-12"
          style={{ animationDelay: `${MARK_DELAY_MS}ms` }}
        >
          <Wordmark link={false} className="text-xl text-[#f7f1e6] md:text-2xl" />
        </div>

        <div className="mt-20 md:mt-24">
          <HarnessDiagram variant="hero" />
        </div>
      </div>
    </section>
  );
}
