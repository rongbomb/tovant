import "server-only";
import { or, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { messages, profiles, providerProfiles } from "@/db/schema";

export interface MessageThread {
  key: string;
  quoteId: string | null;
  jobId: string | null;
  counterpartId: string;
  counterpartName: string;
  messages: { id: string; senderId: string; body: string; createdAt: Date }[];
}

/** All of a user's message threads, newest activity first. */
export async function getMessageThreads(userId: string): Promise<MessageThread[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)))
    .orderBy(messages.createdAt);

  const byKey = new Map<string, MessageThread>();
  for (const m of rows) {
    const key = m.quoteId ?? m.jobId ?? `${m.senderId}-${m.recipientId}`;
    const counterpartId = m.senderId === userId ? m.recipientId : m.senderId;
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        quoteId: m.quoteId,
        jobId: m.jobId,
        counterpartId,
        counterpartName: "",
        messages: [],
      });
    }
    byKey.get(key)!.messages.push({ id: m.id, senderId: m.senderId, body: m.body, createdAt: m.createdAt });
  }

  const threads = Array.from(byKey.values());
  await resolveCounterpartNames(threads);

  threads.sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1]?.createdAt.getTime() ?? 0;
    const bLast = b.messages[b.messages.length - 1]?.createdAt.getTime() ?? 0;
    return bLast - aLast;
  });

  return threads;
}

export async function resolveCounterpartNames(threads: { counterpartId: string; counterpartName: string }[]) {
  const ids = [...new Set(threads.map((t) => t.counterpartId))];
  if (ids.length === 0) return;

  const [profileRows, providerRows] = await Promise.all([
    db.select().from(profiles).where(inArray(profiles.userId, ids)),
    db.select().from(providerProfiles).where(inArray(providerProfiles.userId, ids)),
  ]);
  const profileMap = new Map(profileRows.map((p) => [p.userId, p.displayName]));
  const providerMap = new Map(providerRows.map((p) => [p.userId, p.businessName]));

  for (const t of threads) {
    t.counterpartName = providerMap.get(t.counterpartId) || profileMap.get(t.counterpartId) || "Tovant user";
  }
}
