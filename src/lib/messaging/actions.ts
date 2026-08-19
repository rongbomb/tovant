"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, quotes, jobs } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { requireOwnership, type SessionUser } from "@/lib/security/ownership";

// Ownership is derived from the referenced quote/job (never trusted from the
// client) — same repeated-pattern requirement CLAUDE.md calls out for every
// quote/job/message route.
export async function sendMessage(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in.");

  const quoteId = formData.get("quoteId") ? String(formData.get("quoteId")) : null;
  const jobId = formData.get("jobId") ? String(formData.get("jobId")) : null;
  const body = String(formData.get("body") ?? "").trim();
  const returnPath = String(formData.get("returnPath") ?? "/");

  if (!body) throw new Error("Message can't be empty.");
  if (!quoteId && !jobId) throw new Error("Missing conversation context.");

  const sessionUser = session.user as unknown as SessionUser;
  let recipientId: string;

  if (jobId) {
    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
    const owned = await requireOwnership(job, sessionUser);
    recipientId = owned.ownerId === session.user.id ? owned.providerUserId! : owned.ownerId!;
  } else {
    const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, quoteId!) });
    const owned = await requireOwnership(quote, sessionUser);
    recipientId = owned.ownerId === session.user.id ? owned.providerUserId! : owned.ownerId!;
  }

  await db.insert(messages).values({ quoteId, jobId, senderId: session.user.id, recipientId, body });

  revalidatePath(returnPath);
}
