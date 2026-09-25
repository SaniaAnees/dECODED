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

/**
 * FEEDBACK_TO_EMAIL takes one address or several, separated by commas,
 * semicolons or whitespace, so feedback can go to more than one inbox.
 */
export function parseRecipients(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;\s]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      parseRecipients(process.env.FEEDBACK_TO_EMAIL).length > 0 &&
      process.env.FEEDBACK_FROM_EMAIL?.trim(),
  );
}

/** Send owner notification. Returns false if mail env is missing (DB still saved). */
export async function sendFeedbackEmail(
  payload: FeedbackEmailPayload,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = parseRecipients(process.env.FEEDBACK_TO_EMAIL);
  const from = process.env.FEEDBACK_FROM_EMAIL?.trim();
  if (!apiKey || to.length === 0 || !from) {
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
  const message = {
    from,
    replyTo: payload.email,
    subject,
    text: lines.join("\n"),
  };

  const { error } = await resend.emails.send({ ...message, to });

  if (!error) return true;

  console.error(
    `feedback email failed for ${to.join(", ")}:`,
    error.message ?? error,
  );

  // A single rejected recipient (e.g. an address whose domain is not verified
  // yet) must not stop the others from being notified. Retry one at a time.
  if (to.length === 1) return false;

  let sent = false;
  for (const recipient of to) {
    const { error: singleError } = await resend.emails.send({
      ...message,
      to: recipient,
    });
    if (singleError) {
      console.error(
        `feedback email failed for ${recipient}:`,
        singleError.message ?? singleError,
      );
    } else {
      sent = true;
    }
  }
  return sent;
}

export { isEmailConfigured };
