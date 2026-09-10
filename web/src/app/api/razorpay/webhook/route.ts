import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { isDatabaseConfigured } from "@/db";
import {
  getSubscriptionByRazorpaySubscriptionId,
  markPaymentEventApplied,
  markPaymentEventIgnored,
  recordPaymentEvent,
  updateSubscription,
  type PlanId,
  type SubscriptionStatus,
} from "@/db/dal/subscription";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const preferredRegion = ["bom1", "iad1"];
export const runtime = "nodejs";

type Json = Record<string, unknown>;

function asEntity(payload: Json | undefined, key: string): Json | null {
  if (!payload) return null;
  const wrap = payload[key];
  if (!wrap || typeof wrap !== "object") return null;
  const entity = (wrap as Json).entity;
  if (!entity || typeof entity !== "object") return null;
  return entity as Json;
}

function str(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
}

function unixToDate(v: unknown): Date | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000);
}

async function alertWebhookFailure(detail: string): Promise<void> {
  console.error("[razorpay webhook]", detail);
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to =
    process.env.FEEDBACK_TO_EMAIL?.trim() || CONTACT_EMAIL;
  const from = process.env.FEEDBACK_FROM_EMAIL?.trim();
  if (!apiKey || !from) return;
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: `[${SITE_NAME}] Razorpay webhook issue`,
      text: detail,
    });
  } catch (err) {
    console.error("webhook alert email failed:", err);
  }
}

async function resolveUserId(
  subEntity: Json | null,
  paymentEntity: Json | null,
): Promise<string | null> {
  const subId = str(subEntity?.id);
  if (subId) {
    const row = await getSubscriptionByRazorpaySubscriptionId(subId);
    if (row) return row.userId;
  }

  const notes = subEntity?.notes;
  if (notes && typeof notes === "object") {
    const userId = str((notes as Json).userId);
    if (userId) return userId;
  }

  const payNotes = paymentEntity?.notes;
  if (payNotes && typeof payNotes === "object") {
    const userId = str((payNotes as Json).userId);
    if (userId) return userId;
  }

  return null;
}

async function grantPro(
  userId: string,
  subEntity: Json | null,
): Promise<void> {
  const periodStart = unixToDate(subEntity?.current_start);
  const periodEnd = unixToDate(subEntity?.current_end);
  await updateSubscription(userId, {
    plan: "pro" satisfies PlanId,
    status: "active" satisfies SubscriptionStatus,
    razorpaySubscriptionId: str(subEntity?.id) ?? undefined,
    razorpayPlanId: str(subEntity?.plan_id) ?? undefined,
    razorpayCustomerId: str(subEntity?.customer_id) ?? undefined,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    canceledAt: null,
  });
}

/**
 * Razorpay → server. Signature verified. Events idempotent via payment_event.
 * Browser never writes plan=pro.
 */
export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "db" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  let ok = false;
  try {
    ok = verifyWebhookSignature(rawBody, signature);
  } catch (err) {
    await alertWebhookFailure(`Webhook secret/config error: ${String(err)}`);
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  if (!ok) {
    await alertWebhookFailure(
      "Invalid Razorpay webhook signature. Check RAZORPAY_WEBHOOK_SECRET.",
    );
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let body: Json;
  try {
    body = JSON.parse(rawBody) as Json;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const eventType = str(body.event) || "unknown";
  const eventId =
    str(body.id) ||
    `anon_${createFallbackEventId(eventType, rawBody)}`;

  const payload =
    body.payload && typeof body.payload === "object"
      ? (body.payload as Json)
      : undefined;
  const subEntity = asEntity(payload, "subscription");
  const paymentEntity = asEntity(payload, "payment");

  const razorpaySubscriptionId = str(subEntity?.id);
  const razorpayPaymentId = str(paymentEntity?.id);
  const razorpayOrderId = str(paymentEntity?.order_id);
  const amountPaise = (() => {
    const a = paymentEntity?.amount;
    return typeof a === "number" ? a : null;
  })();

  let userId: string | null = null;
  try {
    userId = await resolveUserId(subEntity, paymentEntity);
  } catch (err) {
    console.error("resolve user failed:", err);
  }

  const inserted = await recordPaymentEvent({
    userId,
    razorpayEventId: eventId,
    eventType,
    razorpayPaymentId,
    razorpaySubscriptionId,
    razorpayOrderId,
    amountPaise,
    currency: str(paymentEntity?.currency) || "INR",
    processingStatus: "recorded",
  });

  if (!inserted) {
    // Duplicate delivery — already handled.
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    switch (eventType) {
      case "subscription.activated":
      case "subscription.charged": {
        if (!userId) {
          await markPaymentEventIgnored(eventId);
          await alertWebhookFailure(
            `${eventType} with no userId. sub=${razorpaySubscriptionId} payment=${razorpayPaymentId}`,
          );
          break;
        }
        await grantPro(userId, subEntity);
        await markPaymentEventApplied(eventId);
        break;
      }

      case "subscription.pending": {
        if (userId) {
          await updateSubscription(userId, {
            status: "incomplete",
            razorpaySubscriptionId: razorpaySubscriptionId ?? undefined,
          });
        }
        await markPaymentEventApplied(eventId);
        break;
      }

      case "subscription.cancelled": {
        if (!userId) {
          await markPaymentEventIgnored(eventId);
          break;
        }
        const periodEnd = unixToDate(subEntity?.current_end);
        const stillInPeriod =
          periodEnd != null && periodEnd.getTime() > Date.now();
        if (stillInPeriod) {
          // Pro until period end (matches Refund policy).
          await updateSubscription(userId, {
            plan: "pro",
            status: "active",
            cancelAtPeriodEnd: true,
            canceledAt: new Date(),
            currentPeriodEnd: periodEnd,
            razorpaySubscriptionId: razorpaySubscriptionId ?? undefined,
          });
        } else {
          await updateSubscription(userId, {
            plan: "free",
            status: "canceled",
            cancelAtPeriodEnd: false,
            canceledAt: new Date(),
            razorpaySubscriptionId: razorpaySubscriptionId ?? undefined,
          });
        }
        await markPaymentEventApplied(eventId);
        break;
      }

      case "subscription.completed":
      case "subscription.halted": {
        if (!userId) {
          await markPaymentEventIgnored(eventId);
          break;
        }
        await updateSubscription(userId, {
          plan: "free",
          status: eventType === "subscription.halted" ? "past_due" : "canceled",
          cancelAtPeriodEnd: false,
          canceledAt: new Date(),
          razorpaySubscriptionId: razorpaySubscriptionId ?? undefined,
        });
        await markPaymentEventApplied(eventId);
        break;
      }

      case "payment.failed": {
        // Log only — do not unlock. Halted handles access revoke.
        await markPaymentEventApplied(eventId);
        break;
      }

      case "payment.captured": {
        // Backup signal: if we can map user + sub, grant Pro.
        if (userId && razorpaySubscriptionId) {
          await grantPro(userId, subEntity);
          await markPaymentEventApplied(eventId);
        } else {
          await markPaymentEventIgnored(eventId);
        }
        break;
      }

      case "refund.processed": {
        if (userId) {
          await updateSubscription(userId, {
            plan: "free",
            status: "canceled",
            cancelAtPeriodEnd: false,
            canceledAt: new Date(),
          });
          await markPaymentEventApplied(eventId);
        } else {
          await markPaymentEventIgnored(eventId);
          await alertWebhookFailure(
            `refund.processed with no userId payment=${razorpayPaymentId}`,
          );
        }
        break;
      }

      default:
        await markPaymentEventIgnored(eventId);
        break;
    }
  } catch (err) {
    await alertWebhookFailure(
      `Handler error for ${eventType} (${eventId}): ${String(err)}`,
    );
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function createFallbackEventId(eventType: string, rawBody: string): string {
  return createHash("sha256")
    .update(`${eventType}:${rawBody}`)
    .digest("hex")
    .slice(0, 40);
}
