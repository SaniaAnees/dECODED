"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialList } from "@/components/about/SocialLinks";
import { ScrollLink } from "@/components/landing/ScrollLink";
import { Wordmark } from "@/components/landing/Wordmark";
import { COMPANY_SOCIALS } from "@/lib/site";

const linkClass =
  "font-serif text-[15px] text-[#f7f1e6]/72 transition-colors hover:text-[#f7f1e6]";

const groupLabel = "font-mono text-[11px] tracking-[0.28em] text-[#e4b45c]";

const productLinks = [
  { href: "/", label: "Home", kind: "page" as const },
  { href: "/pricing", label: "Pricing", kind: "page" as const },
  { href: "/about", label: "About", kind: "page" as const },
  { href: "/#waitlist", label: "Updates", kind: "scroll" as const },
];

const companyLinks = [
  { href: "/feedback", label: "Feedback", kind: "page" as const },
  { href: "/terms", label: "Terms", kind: "page" as const },
  { href: "/privacy", label: "Privacy", kind: "page" as const },
  { href: "/refund", label: "Refund", kind: "page" as const },
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

function FooterColumn({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className={groupLabel}>{label}</p>
      <div className="mt-4">{children}</div>
    </div>
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

        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] md:gap-8">
          <div className="max-w-xs">
            <Wordmark
              link={false}
              className="text-lg font-medium text-[#f7f1e6]/90"
            />
            <p className="mt-4 font-serif text-[15px] leading-relaxed text-[#f7f1e6]/55">
              Infrastructure for AI-assisted software development.
            </p>
          </div>

          <FooterColumn label="PRODUCT">
            <nav aria-label="Product" className="flex flex-col gap-3">
              {productLinks.map((link) =>
                link.kind === "page" ? (
                  <PageLink key={link.label} href={link.href}>
                    {link.label}
                  </PageLink>
                ) : (
                  <ScrollLink
                    key={link.label}
                    href={link.href}
                    className={linkClass}
                  >
                    {link.label}
                  </ScrollLink>
                ),
              )}
            </nav>
          </FooterColumn>

          <FooterColumn label="COMPANY">
            <nav aria-label="Company" className="flex flex-col gap-3">
              {companyLinks.map((link) => (
                <PageLink key={link.label} href={link.href}>
                  {link.label}
                </PageLink>
              ))}
            </nav>
          </FooterColumn>

          <FooterColumn label="SOCIAL">
            <SocialList
              accounts={COMPANY_SOCIALS}
              className="flex-col items-start gap-3"
            />
          </FooterColumn>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="font-serif text-[15px] text-[#f7f1e6]/45">
            © 2026 UseCoded
          </p>
        </div>
      </div>
    </footer>
  );
}
