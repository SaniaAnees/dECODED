import { ISSUES_URL } from "@/lib/site";
import { Wordmark } from "@/components/landing/Wordmark";

export function Footer() {
  return (
    <footer className="relative z-10 mt-4 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,18,40,0.92) 0%, rgba(10,18,40,0) 100%)",
        }}
      />

      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/footer-space.jpg"
          alt=""
          className="footer-space-print h-full w-full object-cover object-[50%_45%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,18,40,0.82) 0%, rgba(10,18,40,0.68) 50%, rgba(8,14,32,0.88) 100%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-14 md:px-8 md:py-16">
        <hr className="mb-10 border-white/10" />
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Wordmark
            link={false}
            className="text-lg font-medium text-[#f7f1e6]/90"
          />
          <div className="flex items-center gap-8">
            <a
              href="#start"
              className="font-serif text-[15px] text-[#f7f1e6]/72 transition-colors hover:text-[#f7f1e6]"
            >
              Waitlist
            </a>
            <a
              href={ISSUES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif text-[15px] text-[#f7f1e6]/72 transition-colors hover:text-[#f7f1e6]"
            >
              Feedback
            </a>
            <p className="font-serif text-[15px] text-[#f7f1e6]/45">© 2026</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
