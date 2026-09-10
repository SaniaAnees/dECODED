import Link from "next/link";
import { ScrollLink } from "@/components/landing/ScrollLink";
import { SignInLink } from "@/components/landing/SignInLink";
import { Wordmark } from "@/components/landing/Wordmark";

const scrollLinks = [
  { href: "/#product", label: "Product" },
  { href: "/#how", label: "How" },
  { href: "/#faq", label: "FAQ" },
];

const linkClass =
  "font-serif text-[15px] text-white/80 transition-colors hover:text-white";

export function Header() {
  return (
    <header className="relative z-40">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-6 md:px-8">
        <Wordmark className="text-lg font-medium text-white" href="/" />

        <nav className="hidden items-center gap-8 md:flex">
          {scrollLinks.map((link) => (
            <ScrollLink key={link.label} href={link.href} className={linkClass}>
              {link.label}
            </ScrollLink>
          ))}
          <Link href="/pricing" className={linkClass}>
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-5">
          <SignInLink />
        </div>
      </div>
    </header>
  );
}
