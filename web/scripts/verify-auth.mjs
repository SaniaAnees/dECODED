/**
 * Production auth checklist — run before deploy: npm run verify:auth
 */
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });

const REQUIRED_TABLES = ["user", "account", "session", "verificationToken"];

function trimSlash(url) {
  return url.replace(/\/$/, "");
}

function getNextAuthUrl() {
  return trimSlash(
    process.env.NEXTAUTH_URL ??
      process.env.NEXT_PUBLIC_AUTH_URL ??
      "http://auth.localhost:3000",
  );
}

function getGoogleCallbackUrl() {
  return `${getNextAuthUrl()}/api/auth/callback/google`;
}

let failed = false;

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  failed = true;
}

function section(title) {
  console.log(`\n${title}`);
}

section("Environment");
if (process.env.AUTH_SECRET) pass("AUTH_SECRET is set");
else fail("AUTH_SECRET is missing");

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  pass("Google OAuth credentials present");
} else {
  fail("AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET missing");
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  pass("GitHub OAuth credentials present");
} else {
  console.log("  · GitHub OAuth not set (AUTH_GITHUB_ID / AUTH_GITHUB_SECRET) — button stays disabled");
}

const nextAuthUrl = getNextAuthUrl();
pass(`NEXTAUTH_URL = ${nextAuthUrl}`);

const mainSite =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://www.localhost:3000";
const authSite =
  process.env.NEXT_PUBLIC_AUTH_URL ?? "http://auth.localhost:3000";
console.log(`  · Main site: ${mainSite}`);
console.log(`  · Auth site: ${authSite}`);
console.log(`  · Cookie domain: ${process.env.AUTH_COOKIE_DOMAIN ?? "(auto)"}`);

section("Google Cloud Console — register these EXACTLY");
console.log("  Local redirect URI (required — Google rejects auth.localhost):");
console.log(`    http://localhost:3000/api/auth/callback/google`);
console.log("  Production redirect URI (wrayle.com):");
console.log(`    https://auth.wrayle.com/api/auth/callback/google`);
console.log("  (Add BOTH if you test locally and ship to prod.)");

section("GitHub OAuth App — register these EXACTLY");
console.log("  Create at https://github.com/settings/developers → OAuth Apps");
console.log("  Local callback:");
console.log(`    http://localhost:3000/api/auth/callback/github`);
console.log("  Production callback:");
console.log(`    https://auth.wrayle.com/api/auth/callback/github`);
console.log("  Then set AUTH_GITHUB_ID + AUTH_GITHUB_SECRET in .env.local and restart next.");

section("URL alignment");
try {
  const authOrigin = new URL(nextAuthUrl).origin;
  const signInOrigin = new URL(authSite).origin;
  if (authOrigin === signInOrigin) {
    pass("NEXTAUTH_URL origin matches NEXT_PUBLIC_AUTH_URL origin");
  } else {
    fail(
      `NEXTAUTH_URL origin (${authOrigin}) ≠ sign-in origin (${signInOrigin})`,
    );
  }
} catch (e) {
  fail(`Invalid auth URL: ${e.message}`);
}

section("Database");
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  fail("DATABASE_URL is not set");
} else {
  const sql = postgres(dbUrl, { max: 1, prepare: false });
  try {
    await sql`SELECT 1 AS ok`;
    pass("DATABASE_URL connects");

    const rows = await sql`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    const names = rows.map((r) => r.tablename);
    for (const table of REQUIRED_TABLES) {
      if (names.includes(table)) pass(`table "${table}" exists`);
      else fail(`table "${table}" missing — run: npm run db:push`);
    }
  } catch (e) {
    fail(`Database error: ${e.message}`);
    console.error(
      "\n  → Copy the exact URI from Supabase → Project Settings → Database",
    );
  } finally {
    await sql.end({ timeout: 1 }).catch(() => {});
  }
}

section("Session mode");
if (process.env.AUTH_USE_DATABASE === "false") {
  console.log("  ⚠ JWT sessions (AUTH_USE_DATABASE=false) — not production default");
} else {
  pass("Database sessions enabled (AUTH_USE_DATABASE ≠ false)");
}

console.log("");
if (failed) {
  console.error("Auth verification FAILED. Fix items above before shipping.\n");
  process.exit(1);
}
console.log("Auth verification passed.\n");
