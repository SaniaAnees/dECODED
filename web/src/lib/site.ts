/** Public site brand and install surface. */
export const SITE_NAME = "usecoded";

/** Plane-seal mark — favicon, header, GitHub OAuth, Open Graph. */
export const BRAND_SEAL_SRC = "/brand/wrayle-seal-sm.png";

/** Shared wordmark typography — serif + letter-spacing. */
export const WORDMARK_CLASS = "font-serif tracking-[0.18em]";

/** Brand name on the site: lowercase source, rendered as small caps. */
export const SITE_NAME_CLASS = `${WORDMARK_CLASS} [font-variant-caps:all-small-caps]`;

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

function authOriginFromPublicUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_AUTH_URL?.trim();
  if (!raw) return undefined;
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).origin;
  } catch {
    return undefined;
  }
}

/** Main marketing site. Prod: https://wrayle.com */
export const MAIN_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (onVercel ? PROD_URLS.main : "http://localhost:3000");

/**
 * In-app proxy docs route — same origin as the landing so client navigation
 * and browser Back stay on the current deploy (not a legacy subdomain hop).
 */
export const PROXY_PATH = "/proxy";

/** Canonical public URL for the proxy subdomain (bookmarks / external refs). */
export const PROXY_SITE_URL =
  process.env.NEXT_PUBLIC_PROXY_URL ??
  (onVercel ? PROD_URLS.proxy : "http://proxy.localhost:3000");

/** Sign-in page. Prod: https://auth.wrayle.com */
export const SIGN_IN_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ??
  (onVercel ? PROD_URLS.signIn : "http://localhost:3000/sign-in");

/** OAuth API origin — must match NEXTAUTH_URL and Google redirect URI host. */
export const OAUTH_ORIGIN =
  authOriginFromPublicUrl() ??
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
  (onVercel ? PROD_URLS.auth : "http://localhost:3000");

/** Post-OAuth welcome (new users). Prod: https://wrayle.com/welcome */
export const WELCOME_URL = `${MAIN_SITE_URL.replace(/\/$/, "")}/welcome`;

/** Public privacy policy. Prod: https://wrayle.com/privacy */
export const PRIVACY_URL = `${MAIN_SITE_URL.replace(/\/$/, "")}/privacy`;

/** Public terms of service. Prod: https://wrayle.com/terms */
export const TERMS_URL = `${MAIN_SITE_URL.replace(/\/$/, "")}/terms`;

/** Public refund / cancellation policy. Prod: https://wrayle.com/refund */
export const REFUND_URL = `${MAIN_SITE_URL.replace(/\/$/, "")}/refund`;

/** Public pricing. Prod: https://wrayle.com/pricing */
export const PRICING_URL = `${MAIN_SITE_URL.replace(/\/$/, "")}/pricing`;

/** Public feedback form. Prod: https://wrayle.com/feedback */
export const FEEDBACK_URL = `${MAIN_SITE_URL.replace(/\/$/, "")}/feedback`;

/** Plans shown on site + required for Razorpay website review. */
export const PLAN_FREE = {
  id: "free",
  name: "Free",
  priceLabel: "$0",
  priceUsd: 0,
  interval: null,
} as const;

export const PLAN_PAID = {
  id: "pro",
  name: "Pro",
  /** Exact monthly price — $10 USD. */
  priceLabel: "$10",
  priceUsd: 10,
  interval: "month",
} as const;

/** Checkout and recurring billing provider. */
export const PAYMENT_PROVIDER = "Razorpay";

export const GITHUB_URL = "https://github.com/SaniaAnees/dECODED";
export const ISSUES_URL = `${GITHUB_URL}/issues/new/choose`;

/** Operator contact — also the Google OAuth user-support address. */
export const CONTACT_EMAIL = "saniaanees91@gmail.com";

/** Primary landing CTA: install, then run the harness. */
export const INSTALL_MAC_LINUX = `curl -fsSL https://wrayle.com/install | bash`;
export const INSTALL_NPM = `npm i -g usecoded@latest`;
export const RUN_COMMAND = `usecoded`;

/** Proxy docs can still show the same public install entrypoint. */
export const SETUP_MAC = `${INSTALL_MAC_LINUX}
${RUN_COMMAND}`;

export const SETUP_LINUX = SETUP_MAC;

export const SETUP_WINDOWS = `${INSTALL_NPM}
${RUN_COMMAND}`;

/** @deprecated use SETUP_MAC / SETUP_LINUX */
export const SETUP_UNIX = SETUP_MAC;

/** Default copy = macOS / Linux. */
export const SETUP_CMD = SETUP_MAC;

export const PLATFORMS = [
  {
    label: "macOS",
    text: SETUP_MAC,
    file: "onboard-mac.gif",
    alt: "macOS: curl install, then usecoded",
  },
  {
    label: "Linux",
    text: SETUP_LINUX,
    file: "onboard-linux.gif",
    alt: "Linux: curl install, then usecoded",
  },
  {
    label: "Windows",
    text: SETUP_WINDOWS,
    file: "onboard-win.gif",
    alt: "Windows: npm install, then usecoded",
  },
] as const;

/** Local CLI proxy — not website URLs. */
export const AGENT_EXPORT = `export ANTHROPIC_BASE_URL="http://127.0.0.1:8080/v1"
export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"`;

export const AGENT_EXPORT_WIN = `$env:ANTHROPIC_BASE_URL="http://127.0.0.1:8080/v1"
$env:OPENAI_BASE_URL="http://127.0.0.1:8080/v1"`;
