import Link from "next/link";
import { BrandMark } from "@/components/landing/BrandMark";
import { MAIN_SITE_URL, SITE_NAME, WORDMARK_CLASS } from "@/lib/site";

type WordmarkProps = {
  className?: string;
  /** Link to main site (default). Set false for static text (e.g. footer). */
  link?: boolean;
  href?: string;
};

export function Wordmark({
  className = "text-white",
  link = true,
  href = MAIN_SITE_URL,
}: WordmarkProps) {
  const inner = (
    <>
      <BrandMark className="h-10 w-10" alt="" />
      <span className={`${WORDMARK_CLASS} ${className}`}>{SITE_NAME}</span>
    </>
  );

  const row = "inline-flex items-center gap-3";

  if (link) {
    return (
      <Link href={href} className={row} aria-label={SITE_NAME}>
        {inner}
      </Link>
    );
  }

  return <span className={row}>{inner}</span>;
}
