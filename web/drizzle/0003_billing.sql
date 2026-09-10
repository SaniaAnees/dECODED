-- Billing: one subscription row per user + idempotent Razorpay event ledger.
CREATE TABLE IF NOT EXISTS "subscription" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "plan" text DEFAULT 'free' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "razorpay_customer_id" text,
  "razorpay_subscription_id" text UNIQUE,
  "razorpay_plan_id" text,
  "current_period_start" timestamp,
  "current_period_end" timestamp,
  "cancel_at_period_end" text DEFAULT 'false' NOT NULL,
  "canceled_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payment_event" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "razorpay_event_id" text NOT NULL UNIQUE,
  "razorpay_payment_id" text,
  "razorpay_subscription_id" text,
  "razorpay_order_id" text,
  "event_type" text NOT NULL,
  "amount_paise" integer,
  "currency" text DEFAULT 'INR',
  "processing_status" text DEFAULT 'recorded' NOT NULL
);

CREATE INDEX IF NOT EXISTS "payment_event_user_id_idx"
  ON "payment_event" ("user_id");

CREATE INDEX IF NOT EXISTS "payment_event_payment_id_idx"
  ON "payment_event" ("razorpay_payment_id");

-- Match waitlist/feedback: server role inserts via DATABASE_URL; no RLS policies.
ALTER TABLE IF EXISTS "subscription" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "payment_event" DISABLE ROW LEVEL SECURITY;
