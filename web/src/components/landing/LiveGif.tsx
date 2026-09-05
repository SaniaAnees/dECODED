"use client";

import { useEffect, useState } from "react";

/** Each instance gets its own decoder so a second copy of the same GIF still animates. */
export function LiveGif({
  src,
  alt,
  className,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const [url, setUrl] = useState(src);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;

    fetch(src)
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={className}
      width={width}
      height={height}
      decoding="async"
    />
  );
}
