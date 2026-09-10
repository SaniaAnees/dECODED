/**
 * Apply drizzle/0002_feedback.sql using DATABASE_URL from .env.local.
 * Usage: node scripts/apply-feedback-migration.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL missing in .env.local");
  process.exit(1);
}

const __dir = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(__dir, "..", "drizzle", "0002_feedback.sql");
const migration = readFileSync(migrationPath, "utf8");

const sql = postgres(url, {
  max: 1,
  prepare: false,
  ssl: url.includes("supabase") ? "require" : undefined,
  connect_timeout: 20,
});

try {
  console.log("Connecting…");
  await sql`SELECT 1 AS ok`;
  console.log("Applying 0002_feedback.sql…");
  await sql.unsafe(migration);

  const rows = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'feedback'
    ORDER BY ordinal_position
  `;

  if (!rows.length) {
    console.error("Table feedback not found after migration");
    process.exit(1);
  }

  console.log("feedback table OK — columns:");
  for (const r of rows) {
    console.log(
      `  ${r.column_name} (${r.data_type}) ${r.is_nullable === "NO" ? "NOT NULL" : "NULL"}`,
    );
  }

  const rls = await sql`
    SELECT relrowsecurity FROM pg_class WHERE relname = 'feedback'
  `;
  console.log("RLS enabled:", rls[0]?.relrowsecurity ?? "unknown");
  console.log("Done.");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exit(1);
} finally {
  await sql.end({ timeout: 2 }).catch(() => {});
}
