"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const HASH_HREF = /^\/(#.+)$/;

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    const scrollFromHash = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      scrollToId(id);
      window.history.replaceState(null, "", "/");
    };

    if (window.location.hash) {
      requestAnimationFrame(() => requestAnimationFrame(scrollFromHash));
    }

    window.addEventListener("hashchange", scrollFromHash);
    return () => window.removeEventListener("hashchange", scrollFromHash);
  }, [pathname]);

  return null;
}

type ScrollLinkProps = React.ComponentProps<"a"> & { href: string };

export function ScrollLink({
  href,
  onClick,
  children,
  ...rest
}: ScrollLinkProps) {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;

    const match = href.match(HASH_HREF);
    if (!match || pathname !== "/") return;

    const id = match[1].slice(1);
    e.preventDefault();
    if (scrollToId(id)) {
      window.history.replaceState(null, "", "/");
    }
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
