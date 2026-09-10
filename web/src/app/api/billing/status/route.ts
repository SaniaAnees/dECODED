import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isDatabaseConfigured } from "@/db";
import {
  expireCancelledIfNeeded,
  isProAccess,
} from "@/db/dal/subscription";
import { getAuthOptions } from "@/lib/auth";
import { PLAN_FREE, PLAN_PAID } from "@/lib/site";

export const preferredRegion = ["bom1", "iad1"];

/** Poll target after Checkout — never trust the browser for plan writes. */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured." },
      { status: 503 },
    );
  }

  const session = await getServerSession(getAuthOptions());
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const row = await expireCancelledIfNeeded(userId);
    const pro = isProAccess(row);
    return NextResponse.json({
      plan: pro ? PLAN_PAID.id : PLAN_FREE.id,
      status: row.status,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd === "true",
      currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
      razorpaySubscriptionId: row.razorpaySubscriptionId,
    });
  } catch (err) {
    console.error("billing status failed:", err);
    return NextResponse.json(
      { error: "Could not load billing status." },
      { status: 500 },
    );
  }
}
