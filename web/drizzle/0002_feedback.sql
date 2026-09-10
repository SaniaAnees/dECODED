-- Feedback form submissions (server inserts via DATABASE_URL).
CREATE TABLE IF NOT EXISTS "feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "email" text NOT NULL,
  "topic" text,
  "message" text NOT NULL,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "page" text,
  "status" text DEFAULT 'new' NOT NULL,
  "user_agent" text
);

-- Match waitlist: no RLS policies; server role inserts directly.
ALTER TABLE IF EXISTS "feedback" DISABLE ROW LEVEL SECURITY;
