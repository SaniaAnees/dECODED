import { GITHUB_URL } from "@/lib/site";
import { GitHubMark } from "@/components/landing/GitHubMark";
import { SignInLink } from "@/components/landing/SignInLink";
import { Wordmark } from "@/components/landing/Wordmark";

const links = [
  { href: "#now", label: "Now" },
  { href: "#next", label: "Next" },
  { href: "#start", label: "Waitlist" },
  { href: "#decoded", label: "dECODED" },
];

export function Header() {
  return (
    <header className="relative z-40">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-6 md:px-8">
        <Wordmark className="text-lg font-medium text-white" href="/" />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-serif text-[15px] text-white/80 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <SignInLink />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Wrayle on GitHub"
            className="text-white/85 transition-colors hover:text-white"
          >
            <GitHubMark />
          </a>
        </div>
      </div>
    </header>
  );
}
