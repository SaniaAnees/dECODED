import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "node:crypto";
import { CONTACT_EMAIL, PLAN_PAID, SITE_NAME } from "@/lib/site";

/** ~10 years of monthly cycles — ongoing until cancel (Razorpay requires total_count). */
export const RAZORPAY_PRO_TOTAL_COUNT = 120;

export function getRazorpayKeyId(): string {
  const key =
    process.env.RAZORPAY_KEY_ID?.trim() ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  if (!key) throw new Error("RAZORPAY_KEY_ID is not configured");
  return key;
}

export function getRazorpayKeySecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET is not configured");
  return secret;
}

export function getRazorpayWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
  return secret;
}

/** Live / Test plan id — never hardcode in app code. */
export function getRazorpayProPlanId(): string {
  const planId = process.env.RAZORPAY_PLAN_ID_PRO?.trim();
  if (!planId) throw new Error("RAZORPAY_PLAN_ID_PRO is not configured");
  return planId;
}

export function getRazorpayPublicKeyId(): string {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  if (!key) throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID is not configured");
  return key;
}

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (client) return client;
  client = new Razorpay({
    key_id: getRazorpayKeyId(),
    key_secret: getRazorpayKeySecret(),
  });
  return client;
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", getRazorpayWebhookSecret())
    .update(rawBody)
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

export function checkoutDisplayName(): string {
  return SITE_NAME;
}

export function checkoutDescription(): string {
  return `${PLAN_PAID.name} — ${PLAN_PAID.priceLabel}/month`;
}

export function billingSupportHint(paymentId?: string | null): string {
  const id = paymentId?.trim();
  if (id) {
    return `Payment received but Pro is not unlocked yet. Email ${CONTACT_EMAIL} with Razorpay payment id ${id}.`;
  }
  return `Payment received but Pro is not unlocked yet. Email ${CONTACT_EMAIL} with your Razorpay payment id.`;
}
