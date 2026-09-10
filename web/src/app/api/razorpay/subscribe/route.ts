import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isDatabaseConfigured } from "@/db";
import {
  ensureFreeSubscription,
  isProAccess,
  updateSubscription,
} from "@/db/dal/subscription";
import { getAuthOptions } from "@/lib/auth";
import {
  RAZORPAY_PRO_TOTAL_COUNT,
  checkoutDescription,
  checkoutDisplayName,
  getRazorpay,
  getRazorpayProPlanId,
  getRazorpayPublicKeyId,
} from "@/lib/razorpay";

export const preferredRegion = ["bom1", "iad1"];

const hits = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const row = hits.get(userId);
  if (!row || now > row.resetAt) {
    hits.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  row.count += 1;
  return row.count > RATE_MAX;
}

type RazorpaySub = {
  id: string;
  status?: string;
  plan_id?: string;
};

/**
 * Create (or reuse) a Razorpay subscription for Checkout.
 * Never trusts client user id. Blocks double-create when possible.
 */
export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured." },
      { status: 503 },
    );
  }

  const session = await getServerSession(getAuthOptions());
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (rateLimited(userId)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a minute and try again." },
      { status: 429 },
    );
  }

  let planId: string;
  let keyId: string;
  try {
    planId = getRazorpayProPlanId();
    keyId = getRazorpayPublicKeyId();
  } catch (err) {
    console.error("razorpay env missing:", err);
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 },
    );
  }

  try {
    const row = await ensureFreeSubscription(userId);

    if (isProAccess(row)) {
      return NextResponse.json(
        { error: "You are already on Pro.", code: "already_pro" },
        { status: 400 },
      );
    }

    const rzp = getRazorpay();

    // Reuse an incomplete subscription so double-click does not create two.
    if (
      row.razorpaySubscriptionId &&
      (row.status === "incomplete" || row.status === "past_due")
    ) {
      try {
        const existing = (await rzp.subscriptions.fetch(
          row.razorpaySubscriptionId,
        )) as RazorpaySub;
        const st = (existing.status || "").toLowerCase();
        if (
          st === "created" ||
          st === "authenticated" ||
          st === "pending" ||
          st === "active"
        ) {
          if (st === "active") {
            await updateSubscription(userId, {
              plan: "pro",
              status: "active",
              razorpaySubscriptionId: existing.id,
              razorpayPlanId: existing.plan_id ?? planId,
            });
            return NextResponse.json(
              { error: "You are already on Pro.", code: "already_pro" },
              { status: 400 },
            );
          }
          return NextResponse.json({
            keyId,
            subscriptionId: existing.id,
            name: checkoutDisplayName(),
            description: checkoutDescription(),
            reused: true,
          });
        }
      } catch (fetchErr) {
        console.warn(
          "could not reuse razorpay subscription, creating new:",
          fetchErr,
        );
      }
    }

    let customerId = row.razorpayCustomerId;
    if (!customerId) {
      try {
        const customer = await rzp.customers.create({
          name: session.user?.name?.trim() || session.user?.email || "usecoded",
          email: session.user?.email || undefined,
          fail_existing: 0,
          notes: { userId },
        });
        customerId = customer.id;
      } catch (custErr) {
        console.warn("razorpay customer create skipped:", custErr);
      }
    }

    // Amount comes from plan_id only — do not pass a freestyle amount.
    const sub = await rzp.subscriptions.create({
      plan_id: planId,
      total_count: RAZORPAY_PRO_TOTAL_COUNT,
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId,
        email: session.user?.email || "",
      },
    });

    await updateSubscription(userId, {
      status: "incomplete",
      razorpayCustomerId: customerId ?? undefined,
      razorpaySubscriptionId: sub.id,
      razorpayPlanId: planId,
      cancelAtPeriodEnd: false,
    });

    return NextResponse.json({
      keyId,
      subscriptionId: sub.id,
      name: checkoutDisplayName(),
      description: checkoutDescription(),
      reused: false,
    });
  } catch (err) {
    console.error("razorpay subscribe failed:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Try again." },
      { status: 500 },
    );
  }
}
