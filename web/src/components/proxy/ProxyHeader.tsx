"use client";

import { GITHUB_URL, MAIN_SITE_URL } from "@/lib/site";
import { GitHubMark } from "@/components/landing/GitHubMark";
import { SignInLink } from "@/components/landing/SignInLink";
import { Wordmark } from "@/components/landing/Wordmark";

const links = [
  { id: "install", label: "Install it" },
  { id: "what-it-does", label: "What it does" },
  { id: "proof", label: "Proof" },
] as const;

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ProxyHeader() {
  return (
    <header className="relative z-40">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-6 md:px-8">
        <Wordmark className="text-lg font-medium text-white" href={MAIN_SITE_URL} />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollToSection(link.id)}
              className="font-serif text-[15px] text-white/80 transition-colors hover:text-white"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <SignInLink />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Wrayle on GitHub"
            className="text-white/85 transition-colors hover:text-white md:inline-flex"
          >
            <GitHubMark />
          </a>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-6 pb-3 md:hidden">
        {links.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => scrollToSection(link.id)}
            className="shrink-0 rounded-full border border-white/20 px-3 py-1 font-serif text-[13px] text-white/85"
          >
            {link.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
