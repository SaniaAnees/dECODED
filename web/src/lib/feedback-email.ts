import nodemailer from "nodemailer";
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

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
};

type MailConfig = {
  /** Resend sender. */
  resendFrom: string;
  resendKey: string | null;
  /** SMTP sender — the mailbox on our own domain. */
  smtpFrom: string;
  smtp: SmtpConfig | null;
};

function readConfig(): MailConfig {
  const resendKey = process.env.RESEND_API_KEY?.trim() || null;
  const resendFrom = process.env.FEEDBACK_FROM_EMAIL?.trim() || "";

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const rawPort = Number(process.env.SMTP_PORT?.trim() || "465");
  const port = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 465;
  const secureEnv = process.env.SMTP_SECURE?.trim().toLowerCase();

  const smtp: SmtpConfig | null =
    host && user && pass
      ? {
          host,
          port,
          secure: secureEnv ? secureEnv === "true" : port === 465,
          user,
          pass,
        }
      : null;

  return {
    resendKey,
    resendFrom,
    smtp,
    smtpFrom: process.env.SMTP_FROM?.trim() || user || "",
  };
}

function isEmailConfigured(): boolean {
  const config = readConfig();
  return Boolean(
    parseRecipients(process.env.FEEDBACK_TO_EMAIL).length > 0 &&
      ((config.resendKey && config.resendFrom) || config.smtp),
  );
}

/** Resend — only reaches addresses its account is permitted to send to. */
async function sendViaResend(
  config: MailConfig,
  payload: FeedbackEmailPayload,
  subject: string,
  text: string,
  recipient: string,
): Promise<boolean> {
  if (!config.resendKey || !config.resendFrom) return false;

  const resend = new Resend(config.resendKey);
  const { error } = await resend.emails.send({
    from: config.resendFrom,
    to: recipient,
    replyTo: payload.email,
    subject,
    text,
  });

  if (error) {
    console.warn(`resend could not reach ${recipient}:`, error.message ?? error);
    return false;
  }
  return true;
}

/** SMTP — the mailbox on our own domain, which can send anywhere. */
async function sendViaSmtp(
  config: MailConfig,
  payload: FeedbackEmailPayload,
  subject: string,
  text: string,
  recipient: string,
): Promise<boolean> {
  if (!config.smtp || !config.smtpFrom) return false;

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });

  try {
    await transporter.sendMail({
      from: config.smtpFrom,
      to: recipient,
      replyTo: payload.email,
      subject,
      text,
    });
    return true;
  } catch (err) {
    console.error(
      `smtp could not reach ${recipient}:`,
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

/**
 * Notify every configured recipient. Each address is attempted on its own, so a
 * transport that cannot reach one address never blocks the others, and the log
 * names the transport that carried each one.
 */
export async function sendFeedbackEmail(
  payload: FeedbackEmailPayload,
): Promise<boolean> {
  const config = readConfig();
  const to = parseRecipients(process.env.FEEDBACK_TO_EMAIL);

  if (to.length === 0 || (!config.resendKey && !config.smtp)) {
    console.warn(
      "feedback email skipped: no recipients, or no transport configured",
    );
    return false;
  }

  const topic = payload.topic ?? "other";
  const subject = `[${SITE_NAME} feedback] ${topic} from ${payload.email}`;
  const text = [
    `Topic: ${topic}`,
    `From: ${payload.email}`,
    `When: ${payload.createdAt.toISOString()}`,
    `Page: ${payload.page ?? "—"}`,
    `User id: ${payload.userId ?? "—"}`,
    "",
    payload.message,
  ].join("\n");

  const delivered: string[] = [];

  for (const recipient of to) {
    // Resend first — it is the established path. SMTP is the transport that can
    // reach an address Resend is not permitted to send to.
    let via: "resend" | "smtp" | null = null;
    if (await sendViaResend(config, payload, subject, text, recipient)) {
      via = "resend";
    } else if (await sendViaSmtp(config, payload, subject, text, recipient)) {
      via = "smtp";
    }

    if (via) delivered.push(`${recipient} (${via})`);
    else console.error(`feedback email undelivered to ${recipient}`);
  }

  console.info(
    delivered.length
      ? `feedback email delivered: ${delivered.join(", ")}`
      : "feedback email delivered to no recipient",
  );

  return delivered.length > 0;
}

export { isEmailConfigured };
