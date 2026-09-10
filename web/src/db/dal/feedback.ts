import { getDb } from "@/db";
import { feedbackEntries } from "@/db/schema";

export type FeedbackTopic = "bug" | "idea" | "billing" | "other";

export type NewFeedback = {
  email: string;
  message: string;
  topic?: FeedbackTopic | null;
  userId?: string | null;
  page?: string | null;
  userAgent?: string | null;
};

export async function insertFeedback(row: NewFeedback): Promise<{ id: string }> {
  const db = getDb();
  const [created] = await db
    .insert(feedbackEntries)
    .values({
      email: row.email,
      message: row.message,
      topic: row.topic ?? null,
      userId: row.userId ?? null,
      page: row.page ?? null,
      userAgent: row.userAgent ?? null,
    })
    .returning({ id: feedbackEntries.id });

  return created;
}
