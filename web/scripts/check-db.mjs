import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });
try {
  const rows = await sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  console.log("DB OK");
  console.log("Tables:", rows.map((r) => r.tablename).join(", ") || "(none)");
} catch (e) {
  console.error("DB FAIL:", e.message);
  process.exit(1);
} finally {
  await sql.end();
}
