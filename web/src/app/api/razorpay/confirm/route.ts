import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isDatabaseConfigured } from "@/db";
import {
  ensureFreeSubscription,
  isProAccess,
  updateSubscription,
} from "@/db/dal/subscription";
import { getAuthOptions } from "@/lib/auth";
import { getRazorpay, getRazorpayKeySecret } from "@/lib/razorpay";

export const preferredRegion = ["bom1", "iad1"];
export const runtime = "nodejs";

type Body = {
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
};

function verifyCheckoutSignature(
  paymentId: string,
  subscriptionId: string,
  signature: string,
): boolean {
  const expected = createHmac("sha256", getRazorpayKeySecret())
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Immediate unlock after Checkout handler — does not wait for webhook.
 * Still verifies Razorpay signature + live subscription status.
 * Webhook remains source of truth for renewals/cancel.
 */
export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const session = await getServerSession(getAuthOptions());
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentId = body.razorpay_payment_id?.trim();
  const subscriptionId = body.razorpay_subscription_id?.trim();
  const signature = body.razorpay_signature?.trim();

  if (!paymentId || !subscriptionId || !signature) {
    return NextResponse.json(
      { error: "Missing payment, subscription, or signature." },
      { status: 400 },
    );
  }

  if (!verifyCheckoutSignature(paymentId, subscriptionId, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    const row = await ensureFreeSubscription(userId);
    if (isProAccess(row)) {
      return NextResponse.json({ plan: "pro", already: true });
    }

    // Subscription id on file must match (or be empty incomplete) for this user.
    if (
      row.razorpaySubscriptionId &&
      row.razorpaySubscriptionId !== subscriptionId &&
      row.plan === "pro"
    ) {
      return NextResponse.json({ error: "Subscription mismatch." }, { status: 400 });
    }

    const rzp = getRazorpay();
    const sub = await rzp.subscriptions.fetch(subscriptionId);
    const st = String(sub.status || "").toLowerCase();

    if (!["active", "authenticated"].includes(st)) {
      // Payment just captured — treat as unlock if payment belongs to this sub.
      try {
        const payment = await rzp.payments.fetch(paymentId);
        const payStatus = String(payment.status || "").toLowerCase();
        if (payStatus !== "captured" && payStatus !== "authorized") {
          return NextResponse.json(
            { plan: "free", pending: true, status: st },
            { status: 202 },
          );
        }
      } catch {
        return NextResponse.json(
          { plan: "free", pending: true, status: st },
          { status: 202 },
        );
      }
    }

    const periodStart =
      typeof sub.current_start === "number"
        ? new Date(sub.current_start * 1000)
        : null;
    const periodEnd =
      typeof sub.current_end === "number"
        ? new Date(sub.current_end * 1000)
        : null;

    await updateSubscription(userId, {
      plan: "pro",
      status: "active",
      razorpaySubscriptionId: subscriptionId,
      razorpayPlanId: typeof sub.plan_id === "string" ? sub.plan_id : undefined,
      razorpayCustomerId:
        typeof sub.customer_id === "string" ? sub.customer_id : undefined,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      canceledAt: null,
    });

    return NextResponse.json({ plan: "pro", paymentId });
  } catch (err) {
    console.error("razorpay confirm failed:", err);
    return NextResponse.json(
      { error: "Could not confirm payment." },
      { status: 500 },
    );
  }
}
