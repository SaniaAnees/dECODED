"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollLink } from "@/components/landing/ScrollLink";
import { Wordmark } from "@/components/landing/Wordmark";

const linkClass =
  "font-serif text-[15px] text-[#f7f1e6]/72 transition-colors hover:text-[#f7f1e6]";

const links = [
  { href: "/terms", label: "Terms", kind: "page" as const },
  { href: "/refund", label: "Refund", kind: "page" as const },
  { href: "/privacy", label: "Privacy", kind: "page" as const },
  { href: "/pricing", label: "Pricing", kind: "page" as const },
  { href: "/feedback", label: "Feedback", kind: "page" as const },
  { href: "/#waitlist", label: "Updates", kind: "scroll" as const },
];

function samePath(pathname: string, href: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  const target = href.replace(/\/$/, "") || "/";
  return path === target;
}

function PageLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={linkClass}
      onClick={(e) => {
        if (!samePath(pathname, href)) return;
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      {children}
    </Link>
  );
}

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
          src="/footer-space.webp"
          alt=""
          width={1536}
          height={1024}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
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
          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center gap-x-2 gap-y-3"
          >
            {links.map((link, index) => (
              <span key={link.href} className="flex items-center gap-x-2">
                {index > 0 ? (
                  <span
                    aria-hidden
                    className="font-serif text-[15px] text-[#f7f1e6]/35"
                  >
                    ·
                  </span>
                ) : null}
                {link.kind === "page" ? (
                  <PageLink href={link.href}>{link.label}</PageLink>
                ) : (
                  <ScrollLink href={link.href} className={linkClass}>
                    {link.label}
                  </ScrollLink>
                )}
              </span>
            ))}
            <span className="flex items-center gap-x-2">
              <span
                aria-hidden
                className="font-serif text-[15px] text-[#f7f1e6]/35"
              >
                ·
              </span>
              <p className="font-serif text-[15px] text-[#f7f1e6]/45">© 2026</p>
            </span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
