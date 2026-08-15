import { eq } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";

export default async function ProviderMessagesPage() {
  const session = await getSession();
  const inbox = session
    ? await db
        .select()
        .from(messages)
        .where(eq(messages.recipientId, session.user.id))
    : [];

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl uppercase tracking-widest text-ash">
        Messages
      </h1>
      {inbox.length === 0 ? (
        <p className="mt-4 text-steel">No messages yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {inbox.map((m) => (
            <li
              key={m.id}
              className="rounded border border-steel/40 bg-graphite p-3 text-ash"
            >
              {m.body}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
