import { Resend } from "resend";
import { SITE_NAME } from "@/lib/site";

export type FeedbackEmailPayload = {
  email: string;
  message: string;
  topic: string | null;
  createdAt: Date;
  userId: string | null;
  page: string | null;
};

function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.FEEDBACK_TO_EMAIL?.trim() &&
      process.env.FEEDBACK_FROM_EMAIL?.trim(),
  );
}

/** Send owner notification. Returns false if mail env is missing (DB still saved). */
export async function sendFeedbackEmail(
  payload: FeedbackEmailPayload,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.FEEDBACK_TO_EMAIL?.trim();
  const from = process.env.FEEDBACK_FROM_EMAIL?.trim();
  if (!apiKey || !to || !from) {
    console.warn("feedback email skipped: RESEND_API_KEY / FEEDBACK_* not set");
    return false;
  }

  const topic = payload.topic ?? "other";
  const subject = `[${SITE_NAME} feedback] ${topic} from ${payload.email}`;
  const lines = [
    `Topic: ${topic}`,
    `From: ${payload.email}`,
    `When: ${payload.createdAt.toISOString()}`,
    `Page: ${payload.page ?? "—"}`,
    `User id: ${payload.userId ?? "—"}`,
    "",
    payload.message,
  ];

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: payload.email,
    subject,
    text: lines.join("\n"),
  });

  if (error) {
    console.error("feedback email failed:", error.message ?? error);
    return false;
  }
  return true;
}

export { isEmailConfigured };
