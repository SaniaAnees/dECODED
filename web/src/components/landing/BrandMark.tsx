import { BRAND_SEAL_SRC, SITE_NAME } from "@/lib/site";

type BrandMarkProps = {
  className?: string;
  /** Empty when the wordmark sits beside it. */
  alt?: string;
};

export function BrandMark({
  className = "h-10 w-10",
  alt = SITE_NAME,
}: BrandMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_SEAL_SRC}
      alt={alt}
      width={40}
      height={40}
      className={`rounded-full ${className}`}
      decoding="async"
    />
  );
}
