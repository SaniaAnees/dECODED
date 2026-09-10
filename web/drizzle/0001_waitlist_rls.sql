-- Server-side waitlist inserts use DATABASE_URL (postgres role).
-- RLS with no policies can block pooler roles; disable for this table.
ALTER TABLE IF EXISTS "waitlist_entry" DISABLE ROW LEVEL SECURITY;
