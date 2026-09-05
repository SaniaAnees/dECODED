/**
 * One-shot Supabase setup: connect + create NextAuth + waitlist tables.
 * Usage: npm run db:setup
 * Requires DATABASE_URL in .env.local (copy from Supabase → Connect → URI).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error(`
DATABASE_URL is missing.

Fix:
  1. Supabase dashboard → Connect (top) → copy URI
  2. Paste into web/.env.local as DATABASE_URL=...
  3. Run: npm run db:setup
`);
  process.exit(1);
}

const __dir = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dir, "..", "drizzle", "0000_init.sql");
const initSql = readFileSync(sqlPath, "utf8");

const sql = postgres(url, { max: 1, prepare: false });

try {
  console.log("Connecting to Supabase...");
  await sql`SELECT 1 AS ok`;
  console.log("Connected.\nRunning schema (0000_init.sql)...");

  await sql.unsafe(initSql);

  const tables = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;

  console.log("\nTables in public schema:");
  for (const row of tables) {
    console.log(`  • ${row.tablename}`);
  }

  const required = ["user", "account", "session", "verificationToken", "waitlist_entry"];
  const names = tables.map((r) => r.tablename);
  const missing = required.filter((t) => !names.includes(t));

  if (missing.length) {
    console.error("\nMissing tables:", missing.join(", "));
    process.exit(1);
  }

  console.log("\n✓ Database ready for NextAuth (official / production path).");
  console.log("  Set AUTH_USE_DATABASE=true in .env.local, then: npm run verify:auth\n");
} catch (e) {
  console.error("\n✗ Setup failed:", e.message);
  console.error(`
Common fixes:
  • Copy URI from Supabase → Connect (do not type project id by hand)
  • If password has special chars, keep it URL-encoded in the URI
  • Try "Session pooler" URI if direct db.*.supabase.co fails
  • Or paste 0000_init.sql manually in Supabase → SQL Editor → Run
`);
  process.exit(1);
} finally {
  await sql.end({ timeout: 2 }).catch(() => {});
}
