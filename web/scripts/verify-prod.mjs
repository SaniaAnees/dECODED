/**
 * Production deploy checklist — run: npm run verify:prod
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PROD = {
  main: "https://wrayle.com",
  auth: "https://auth.wrayle.com",
  proxy: "https://proxy.wrayle.com",
  signIn: "https://auth.wrayle.com",
  googleCallback: "https://auth.wrayle.com/api/auth/callback/google",
  githubCallback: "https://auth.wrayle.com/api/auth/callback/github",
  cookieDomain: ".wrayle.com",
};

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Wrayle — production checklist (you do these in dashboards)  ║
╚══════════════════════════════════════════════════════════════╝

WEBSITE URLS (give publishers the main link):
  Main:   ${PROD.main}
  Auth:   ${PROD.auth}
  Proxy:  ${PROD.proxy}

VERCEL → Project → Settings → Environment Variables (Production):
  NEXT_PUBLIC_SITE_URL=${PROD.main}
  NEXT_PUBLIC_AUTH_URL=${PROD.auth}
  NEXT_PUBLIC_PROXY_URL=${PROD.proxy}
  NEXTAUTH_URL=${PROD.auth}
  AUTH_COOKIE_DOMAIN=${PROD.cookieDomain}
  AUTH_USE_DATABASE=true
  DATABASE_URL=<Supabase pooler URI, port 6543>
  AUTH_SECRET=<same as local or new>
  AUTH_GOOGLE_ID=<your client id>
  AUTH_GOOGLE_SECRET=<your client secret>
  AUTH_GITHUB_ID=<your GitHub OAuth client id>
  AUTH_GITHUB_SECRET=<your GitHub OAuth client secret>

VERCEL → Settings → Domains (add all four):
  wrayle.com
  www.wrayle.com          (middleware redirects www → apex)
  auth.wrayle.com
  proxy.wrayle.com

DOMAIN REGISTRAR → DNS (point to Vercel — use values Vercel shows):
  @     → Vercel apex
  auth  → cname to Vercel
  proxy → cname to Vercel
  www   → cname to Vercel

GOOGLE CLOUD CONSOLE → OAuth client → Authorized redirect URIs:
  http://localhost:3000/api/auth/callback/google
  https://auth.wrayle.com/api/auth/callback/google

GITHUB → Settings → Developer settings → OAuth Apps:
  http://localhost:3000/api/auth/callback/github
  https://auth.wrayle.com/api/auth/callback/github

SUPABASE:
  Same project — use Transaction pooler URI on Vercel (port 6543)

CODE (already done in repo):
  ✓ Wrayle wordmark
  ✓ Subdomain middleware (auth.* / proxy.*)
  ✓ www.wrayle.com → wrayle.com redirect
  ✓ PROD_URLS in src/lib/site.ts

CANNOT be done from code (you must do in browser):
  • DNS records at domain registrar
  • Vercel domain + env var setup
  • Google Console redirect URI click-save
  • Supabase dashboard (tables already created)

SESSION (already configured in code):
  ✓ Database sessions — same browser stays signed in ~30 days
  ✓ Rolling refresh — active users extend session daily
  ✓ Cookie domain .wrayle.com in prod (wrayle.com + auth + proxy)
  ✓ New user → welcome slide; returning user → straight to home
  ✓ Sign out clears session; new browser/device → Google once per session
`);
