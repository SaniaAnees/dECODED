import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** NextAuth — Google sign-in users land in `user`. */
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

/** Hero waitlist — one row per email. */
export const waitlistEntries = pgTable("waitlist_entry", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/** Site feedback form — one row per submission. */
export const feedbackEntries = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  email: text("email").notNull(),
  topic: text("topic"),
  message: text("message").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  page: text("page"),
  status: text("status").notNull().default("new"),
  userAgent: text("user_agent"),
});

/**
 * One billing row per signed-in user — source of truth for Free vs Pro.
 * Webhooks update this; the website never trusts Checkout alone.
 */
export const subscriptions = pgTable("subscription", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  /** free | pro — matches PLAN_FREE.id / PLAN_PAID.id */
  plan: text("plan").notNull().default("free"),
  /** active | canceled | past_due | incomplete */
  status: text("status").notNull().default("active"),
  razorpayCustomerId: text("razorpay_customer_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id").unique(),
  razorpayPlanId: text("razorpay_plan_id"),
  currentPeriodStart: timestamp("current_period_start", { mode: "date" }),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
  /** "true" | "false" — cancel at period end without immediate revoke */
  cancelAtPeriodEnd: text("cancel_at_period_end").notNull().default("false"),
  canceledAt: timestamp("canceled_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

/**
 * Idempotent Razorpay webhook / payment ledger.
 * Same razorpay_event_id must never unlock Pro twice.
 */
export const paymentEvents = pgTable("payment_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  /** Razorpay event.id — unique for idempotency */
  razorpayEventId: text("razorpay_event_id").notNull().unique(),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  razorpayOrderId: text("razorpay_order_id"),
  eventType: text("event_type").notNull(),
  /** Amount in paise (INR × 100), null if not a money event */
  amountPaise: integer("amount_paise"),
  currency: text("currency").default("INR"),
  /** recorded | applied | ignored */
  processingStatus: text("processing_status").notNull().default("recorded"),
});
