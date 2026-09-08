"use client";

/** Native img — no extra fetch/blob copy (that downloaded the GIF twice). */
export function LiveGif({
  src,
  alt,
  className,
  width,
  height,
  lazy = false,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  lazy?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      decoding="async"
      loading={lazy ? "lazy" : "eager"}
      fetchPriority={lazy ? "low" : "low"}
    />
  );
}
