import { MAIN_SITE_URL, WELCOME_URL } from "@/lib/site";

/**
 * Safe post-auth return path on the main site (e.g. /pricing).
 * Rejects open redirects.
 */
export function safeReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  try {
    if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
      if (value.startsWith("/sign-in") || value.startsWith("/api/")) return null;
      return value;
    }

    const main = new URL(MAIN_SITE_URL);
    const target = new URL(value);
    if (target.origin !== main.origin) return null;
    const path = `${target.pathname}${target.search}${target.hash}`;
    if (path.startsWith("/sign-in") || path.startsWith("/api/")) return null;
    return path || "/";
  } catch {
    return null;
  }
}

/** Absolute URL on main site for a safe path. */
export function absoluteReturnUrl(path: string): string {
  const main = MAIN_SITE_URL.replace(/\/$/, "");
  return `${main}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * OAuth callback: welcome animation, then continue to `next` (e.g. /pricing).
 * Default welcome with no next → home after animation.
 */
export function oauthCallbackWithReturn(
  returnPath: string | null,
): string {
  if (!returnPath || returnPath === "/" || returnPath === "/welcome") {
    return WELCOME_URL;
  }
  const welcome = WELCOME_URL.replace(/\/$/, "");
  return `${welcome}?next=${encodeURIComponent(returnPath)}`;
}
