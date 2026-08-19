import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotes, jobs } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { getMessageThreads, resolveCounterpartNames, type MessageThread } from "@/lib/messaging/threads";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { sendMessage } from "@/lib/messaging/actions";

async function resolveDeepLinkThread(
  userId: string,
  quoteId: string | null,
  jobId: string | null,
  existing: MessageThread[],
): Promise<MessageThread | null> {
  if (!quoteId && !jobId) return null;
  const already = existing.find((t) => (quoteId && t.quoteId === quoteId) || (jobId && t.jobId === jobId));
  if (already) return null;

  if (jobId) {
    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
    if (!job || job.providerUserId !== userId) return null;
    const thread: MessageThread = {
      key: jobId,
      quoteId: null,
      jobId,
      counterpartId: job.ownerId,
      counterpartName: "",
      messages: [],
    };
    await resolveCounterpartNames([thread]);
    return thread;
  }

  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, quoteId!) });
  if (!quote || quote.providerUserId !== userId) return null;
  const thread: MessageThread = {
    key: quoteId!,
    quoteId,
    jobId: null,
    counterpartId: quote.ownerId,
    counterpartName: "",
    messages: [],
  };
  await resolveCounterpartNames([thread]);
  return thread;
}

function ThreadCard({ thread, userId }: { thread: MessageThread; userId: string }) {
  return (
    <Card className="flex flex-col gap-4">
      <p className="font-semibold">{thread.counterpartName}</p>
      {thread.messages.length > 0 ? (
        <div className="flex flex-col gap-2">
          {thread.messages.map((m) => {
            const mine = m.senderId === userId;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "75%",
                    borderRadius: 14,
                    padding: "8px 14px",
                    fontSize: 14,
                    background: mine ? "var(--home-accent)" : "var(--home-tint)",
                    color: mine ? "var(--home-bg)" : "var(--home-text)",
                  }}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>
          No messages yet — say hello.
        </p>
      )}
      <form action={sendMessage} className="flex items-end gap-2">
        {thread.quoteId ? <input type="hidden" name="quoteId" value={thread.quoteId} /> : null}
        {thread.jobId ? <input type="hidden" name="jobId" value={thread.jobId} /> : null}
        <input type="hidden" name="returnPath" value="/provider/messages" />
        <Textarea name="body" required placeholder="Write a message…" style={{ minHeight: 44, flex: 1 }} />
        <Button type="submit">Send</Button>
      </form>
    </Card>
  );
}

export default async function ProviderMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ quoteId?: string; jobId?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { quoteId, jobId } = await searchParams;

  const threads = await getMessageThreads(session.user.id);
  const deepLinkThread = await resolveDeepLinkThread(session.user.id, quoteId ?? null, jobId ?? null, threads);
  const allThreads = deepLinkThread ? [deepLinkThread, ...threads] : threads;

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="home-serif" style={{ fontSize: 28 }}>
        Messages
      </h1>

      {allThreads.length === 0 ? (
        <EmptyState>No conversations yet.</EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {allThreads.map((thread) => (
            <ThreadCard key={thread.key} thread={thread} userId={session.user.id} />
          ))}
        </div>
      )}
    </div>
  );
}
