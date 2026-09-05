import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { decodedDb?: Db };

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = postgres(url, { prepare: false, max: 1 });
  return drizzle(client, { schema });
}

/** Real Postgres Drizzle client. Created once, on first call. */
export function getDb(): Db {
  if (!globalForDb.decodedDb) {
    globalForDb.decodedDb = createDb();
  }
  return globalForDb.decodedDb;
}
