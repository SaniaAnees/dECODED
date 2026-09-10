import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { paymentEvents, subscriptions } from "@/db/schema";
import { PLAN_FREE, PLAN_PAID } from "@/lib/site";

export type PlanId = typeof PLAN_FREE.id | typeof PLAN_PAID.id;
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "incomplete";

export type SubscriptionRow = typeof subscriptions.$inferSelect;

/** Ensure every signed-in user has a Free row (idempotent). */
export async function ensureFreeSubscription(
  userId: string,
): Promise<SubscriptionRow> {
  const db = getDb();
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(subscriptions)
    .values({
      userId,
      plan: PLAN_FREE.id,
      status: "active",
    })
    .onConflictDoNothing({ target: subscriptions.userId })
    .returning();

  if (created) return created;

  const [again] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!again) {
    throw new Error("Failed to ensure free subscription");
  }
  return again;
}

export async function getSubscriptionByUserId(
  userId: string,
): Promise<SubscriptionRow | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getSubscriptionByRazorpaySubscriptionId(
  razorpaySubscriptionId: string,
): Promise<SubscriptionRow | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscriptionId))
    .limit(1);
  return row ?? null;
}

/**
 * If cancel-at-period-end and the paid period is over, demote to Free.
 * Safe to call on every status poll.
 */
export async function expireCancelledIfNeeded(
  userId: string,
): Promise<SubscriptionRow> {
  const row = await ensureFreeSubscription(userId);
  if (
    row.plan === PLAN_PAID.id &&
    row.cancelAtPeriodEnd === "true" &&
    row.currentPeriodEnd &&
    row.currentPeriodEnd.getTime() <= Date.now()
  ) {
    return updateSubscription(userId, {
      plan: PLAN_FREE.id,
      status: "canceled",
      cancelAtPeriodEnd: false,
      canceledAt: row.canceledAt ?? new Date(),
    });
  }
  return row;
}

/** True when plan is pro and status allows access. */
export function isProAccess(row: SubscriptionRow | null | undefined): boolean {
  if (!row) return false;
  return row.plan === PLAN_PAID.id && row.status === "active";
}

export type SubscriptionPatch = {
  plan?: PlanId;
  status?: SubscriptionStatus;
  razorpayCustomerId?: string | null;
  razorpaySubscriptionId?: string | null;
  razorpayPlanId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
};

export async function updateSubscription(
  userId: string,
  patch: SubscriptionPatch,
): Promise<SubscriptionRow> {
  await ensureFreeSubscription(userId);
  const db = getDb();

  const [updated] = await db
    .update(subscriptions)
    .set({
      ...(patch.plan !== undefined ? { plan: patch.plan } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.razorpayCustomerId !== undefined
        ? { razorpayCustomerId: patch.razorpayCustomerId }
        : {}),
      ...(patch.razorpaySubscriptionId !== undefined
        ? { razorpaySubscriptionId: patch.razorpaySubscriptionId }
        : {}),
      ...(patch.razorpayPlanId !== undefined
        ? { razorpayPlanId: patch.razorpayPlanId }
        : {}),
      ...(patch.currentPeriodStart !== undefined
        ? { currentPeriodStart: patch.currentPeriodStart }
        : {}),
      ...(patch.currentPeriodEnd !== undefined
        ? { currentPeriodEnd: patch.currentPeriodEnd }
        : {}),
      ...(patch.cancelAtPeriodEnd !== undefined
        ? {
            cancelAtPeriodEnd: patch.cancelAtPeriodEnd ? "true" : "false",
          }
        : {}),
      ...(patch.canceledAt !== undefined
        ? { canceledAt: patch.canceledAt }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId))
    .returning();

  if (!updated) {
    throw new Error("Subscription update failed");
  }
  return updated;
}

export type NewPaymentEvent = {
  userId?: string | null;
  razorpayEventId: string;
  eventType: string;
  razorpayPaymentId?: string | null;
  razorpaySubscriptionId?: string | null;
  razorpayOrderId?: string | null;
  amountPaise?: number | null;
  currency?: string | null;
  processingStatus?: "recorded" | "applied" | "ignored";
};

/**
 * Insert a webhook/payment event. Returns null if razorpay_event_id
 * already exists (idempotent — caller should skip re-apply).
 */
export async function recordPaymentEvent(
  row: NewPaymentEvent,
): Promise<{ id: string } | null> {
  const db = getDb();
  const [created] = await db
    .insert(paymentEvents)
    .values({
      userId: row.userId ?? null,
      razorpayEventId: row.razorpayEventId,
      eventType: row.eventType,
      razorpayPaymentId: row.razorpayPaymentId ?? null,
      razorpaySubscriptionId: row.razorpaySubscriptionId ?? null,
      razorpayOrderId: row.razorpayOrderId ?? null,
      amountPaise: row.amountPaise ?? null,
      currency: row.currency ?? "INR",
      processingStatus: row.processingStatus ?? "recorded",
    })
    .onConflictDoNothing({ target: paymentEvents.razorpayEventId })
    .returning({ id: paymentEvents.id });

  return created ?? null;
}

export async function markPaymentEventApplied(eventId: string): Promise<void> {
  const db = getDb();
  await db
    .update(paymentEvents)
    .set({ processingStatus: "applied" })
    .where(eq(paymentEvents.razorpayEventId, eventId));
}

export async function markPaymentEventIgnored(eventId: string): Promise<void> {
  const db = getDb();
  await db
    .update(paymentEvents)
    .set({ processingStatus: "ignored" })
    .where(eq(paymentEvents.razorpayEventId, eventId));
}
