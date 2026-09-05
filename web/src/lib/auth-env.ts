import { PROD_URLS } from "@/lib/site";

/**
 * Canonical auth URLs — must match Google Console redirect URIs exactly.
 * Local URLs: .env.local only (gitignored).
 * Prod: https://auth.wrayle.com
 */

function trimSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/** Where NextAuth lives; must equal the host that serves /api/auth/callback/google */
export function getNextAuthUrl(): string {
  const onVercel = Boolean(process.env.VERCEL);
  return trimSlash(
    process.env.NEXTAUTH_URL ??
      (onVercel ? PROD_URLS.auth : "http://localhost:3000"),
  );
}

/** Google OAuth redirect URI — register this exact string in Google Cloud Console */
export function getGoogleCallbackUrl(): string {
  return `${getNextAuthUrl()}/api/auth/callback/google`;
}

/** GitHub OAuth redirect URI — register this exact string on the GitHub OAuth App */
export function getGitHubCallbackUrl(): string {
  return `${getNextAuthUrl()}/api/auth/callback/github`;
}

/**
 * Shared cookie domain so session works on auth.* and main site.
 * Local localhost: host-only cookies (Domain=.localhost breaks Chrome).
 * Prod: .wrayle.com (or set AUTH_COOKIE_DOMAIN in env).
 */
export function getAuthCookieDomain(): string | undefined {
  const explicit = process.env.AUTH_COOKIE_DOMAIN?.trim();
  if (explicit) return explicit || undefined;

  try {
    const host = new URL(getNextAuthUrl()).hostname;
    if (host === "localhost") return undefined;
    if (host.endsWith(".localhost")) return ".localhost";
    const parts = host.split(".");
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join(".")}`;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

export function authCookiesSecure(): boolean {
  return getNextAuthUrl().startsWith("https://");
}

/** Env checklist for scripts / health checks */
export function getAuthEnvChecklist() {
  const nextAuthUrl = getNextAuthUrl();
  return {
    nextAuthUrl,
    googleCallbackUrl: getGoogleCallbackUrl(),
    githubCallbackUrl: getGitHubCallbackUrl(),
    cookieDomain: getAuthCookieDomain() ?? "(host-only)",
    hasSecret: Boolean(process.env.AUTH_SECRET),
    hasGoogle: Boolean(
      process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
    ),
    hasGitHub: Boolean(
      process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
    ),
    hasDatabase: Boolean(process.env.DATABASE_URL),
    databaseSessions: process.env.AUTH_USE_DATABASE !== "false",
    mainSiteUrl:
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL ? PROD_URLS.main : "http://localhost:3000"),
    authSiteUrl:
      process.env.NEXT_PUBLIC_AUTH_URL ??
      (process.env.VERCEL ? PROD_URLS.signIn : "http://localhost:3000/sign-in"),
  };
}
