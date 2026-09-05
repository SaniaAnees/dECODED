import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/db";
import { addWaitlistEmail } from "@/db/dal/waitlist";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Waitlist is not configured yet." },
      { status: 503 },
    );
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  try {
    await addWaitlistEmail(email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("waitlist insert failed:", err);
    return NextResponse.json({ error: "Could not save email." }, { status: 500 });
  }
}
