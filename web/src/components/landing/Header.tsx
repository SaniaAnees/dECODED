import Link from "next/link";
import { GITHUB_URL } from "@/lib/site";

const links = [
  { href: "#now", label: "Now" },
  { href: "#next", label: "Next" },
  { href: "#start", label: "Waitlist" },
];

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6 md:px-8">
        <Link href="/" className="font-serif text-sm tracking-[0.18em] text-white">
          dECODED
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-serif text-[15px] text-white/80 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-serif text-[15px] text-white/80 transition-colors hover:text-white"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
