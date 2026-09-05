import { getDb } from "@/db";
import { waitlistEntries } from "@/db/schema";

export async function addWaitlistEmail(email: string): Promise<"added" | "exists"> {
  const db = getDb();
  const rows = await db
    .insert(waitlistEntries)
    .values({ email })
    .onConflictDoNothing({ target: waitlistEntries.email })
    .returning({ id: waitlistEntries.id });

  return rows.length > 0 ? "added" : "exists";
}
