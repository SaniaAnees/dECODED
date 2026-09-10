import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isDatabaseConfigured } from "@/db";
import {
  insertFeedback,
  type FeedbackTopic,
} from "@/db/dal/feedback";
import { getAuthOptions } from "@/lib/auth";
import { sendFeedbackEmail } from "@/lib/feedback-email";

export const preferredRegion = ["bom1", "iad1"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = new Set<FeedbackTopic>(["bug", "idea", "billing", "other"]);
const MAX_EMAIL = 320;
const MAX_MESSAGE = 5000;
const MAX_PAGE = 500;

/** Best-effort in-memory rate limit (per isolate). */
const hits = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 8;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now > row.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  row.count += 1;
  return row.count > RATE_MAX;
}

function parseTopic(raw: unknown): FeedbackTopic | null {
  if (raw == null || raw === "") return null;
  const value = String(raw).trim().toLowerCase();
  if (!TOPICS.has(value as FeedbackTopic)) return null;
  return value as FeedbackTopic;
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Feedback is not configured yet." },
      { status: 503 },
    );
  }

  if (rateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many submissions. Try again shortly." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot — silent success, no save / no email.
  const honey = String(body.company ?? body.website ?? "").trim();
  if (honey) {
    return NextResponse.json({ ok: true });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase()
    .slice(0, MAX_EMAIL);
  const message = String(body.message ?? "")
    .trim()
    .slice(0, MAX_MESSAGE);
  const topicRaw = body.topic;
  const topic =
    topicRaw == null || topicRaw === ""
      ? null
      : parseTopic(topicRaw);

  if (topicRaw != null && topicRaw !== "" && topic === null) {
    return NextResponse.json({ error: "Invalid topic." }, { status: 400 });
  }

  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Enter a message." }, { status: 400 });
  }

  // Reject spammy all-same-character / tiny noise payloads.
  if (message.length < 2 || /^(.)\1{20,}$/.test(message)) {
    return NextResponse.json({ error: "Enter a message." }, { status: 400 });
  }

  let page =
    body.page == null || body.page === ""
      ? "/feedback"
      : String(body.page).trim().slice(0, MAX_PAGE);
  if (!page.startsWith("/")) page = "/feedback";

  const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;

  let userId: string | null = null;
  try {
    const session = await getServerSession(getAuthOptions());
    userId = session?.user?.id ?? null;
  } catch {
    userId = null;
  }

  const createdAt = new Date();

  try {
    await insertFeedback({
      email,
      message,
      topic,
      userId,
      page,
      userAgent,
    });
  } catch (err) {
    console.error("feedback insert failed");
    void err;
    return NextResponse.json(
      { error: "Could not save feedback." },
      { status: 500 },
    );
  }

  try {
    await sendFeedbackEmail({
      email,
      message,
      topic,
      createdAt,
      userId,
      page,
    });
  } catch (err) {
    console.error("feedback email threw");
    void err;
  }

  return NextResponse.json({ ok: true });
}
