/** Public site brand (UI wordmark). CLI product name remains `decoded`. */
export const SITE_NAME = "Wrayle";

/** Plane-seal mark — favicon, header, GitHub OAuth, Open Graph. */
export const BRAND_SEAL_SRC = "/brand/wrayle-seal.png";

/** Shared wordmark typography — serif + letter-spacing. */
export const WORDMARK_CLASS = "font-serif tracking-[0.18em]";

/**
 * Production URLs — canonical https://wrayle.com (set on Vercel via env vars).
 * Local dev URLs belong in .env.local only (gitignored).
 */
export const PROD_URLS = {
  main: "https://wrayle.com",
  auth: "https://auth.wrayle.com",
  proxy: "https://proxy.wrayle.com",
  signIn: "https://auth.wrayle.com",
  welcome: "https://wrayle.com/welcome",
  googleCallback: "https://auth.wrayle.com/api/auth/callback/google",
  githubCallback: "https://auth.wrayle.com/api/auth/callback/github",
  cookieDomain: ".wrayle.com",
} as const;

const onVercel = Boolean(process.env.VERCEL);

/** Main marketing site. Prod: https://wrayle.com */
export const MAIN_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (onVercel ? PROD_URLS.main : "http://localhost:3000");

/** Install + proxy docs. Prod: https://proxy.wrayle.com */
export const PROXY_SITE_URL =
  process.env.NEXT_PUBLIC_PROXY_URL ??
  (onVercel ? PROD_URLS.proxy : "http://proxy.localhost:3000");

/** Sign-in page. Prod: https://auth.wrayle.com */
export const SIGN_IN_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ??
  (onVercel ? PROD_URLS.signIn : "http://localhost:3000/sign-in");

/** OAuth API origin — must match NEXTAUTH_URL and Google redirect URI host. */
export const OAUTH_ORIGIN =
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
  (onVercel ? PROD_URLS.auth : "http://localhost:3000");

/** Post-OAuth welcome (new users). Prod: https://wrayle.com/welcome */
export const WELCOME_URL = `${MAIN_SITE_URL.replace(/\/$/, "")}/welcome`;

export const GITHUB_URL = "https://github.com/SaniaAnees/dECODED";
export const ISSUES_URL = `${GITHUB_URL}/issues/new/choose`;

/** First-time onboarding: install, then start. Same two lines on macOS and Linux. */
export const SETUP_MAC = `curl -fsSL https://raw.githubusercontent.com/SaniaAnees/dECODED/main/install.sh | sh
decoded start`;

export const SETUP_LINUX = SETUP_MAC;

export const SETUP_WINDOWS = `irm https://raw.githubusercontent.com/SaniaAnees/dECODED/main/install.ps1 | iex
decoded start`;

/** @deprecated use SETUP_MAC / SETUP_LINUX */
export const SETUP_UNIX = SETUP_MAC;

/** Default copy = macOS / Linux. */
export const SETUP_CMD = SETUP_MAC;

export const PLATFORMS = [
  {
    label: "macOS",
    text: SETUP_MAC,
    file: "onboard-mac.gif",
    alt: "macOS: curl install, then decoded start",
  },
  {
    label: "Linux",
    text: SETUP_LINUX,
    file: "onboard-linux.gif",
    alt: "Linux: curl install, then decoded start",
  },
  {
    label: "Windows",
    text: SETUP_WINDOWS,
    file: "onboard-win.gif",
    alt: "Windows: irm install, then decoded start",
  },
] as const;

/** Local CLI proxy — not website URLs. */
export const AGENT_EXPORT = `export ANTHROPIC_BASE_URL="http://127.0.0.1:8080/v1"
export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"`;

export const AGENT_EXPORT_WIN = `$env:ANTHROPIC_BASE_URL="http://127.0.0.1:8080/v1"
$env:OPENAI_BASE_URL="http://127.0.0.1:8080/v1"`;
