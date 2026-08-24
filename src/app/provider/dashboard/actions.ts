"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotes, providerProfiles } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import { notifyUser } from "@/lib/notifications/notify";

async function loadOwnedQuote(quoteId: string, providerUserId: string) {
  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, quoteId) });
  if (!quote || quote.providerUserId !== providerUserId) {
    throw new Error("Lead not found.");
  }
  return quote;
}

export async function sendQuote(formData: FormData) {
  const session = await requireRole("provider");
  const quoteId = String(formData.get("quoteId") ?? "");
  const amountDollars = Number(formData.get("amount"));
  const paymentModeRaw = String(formData.get("paymentMode") ?? "off_platform");
  const paymentMode = paymentModeRaw === "in_app" ? "in_app" : "off_platform";

  if (!Number.isFinite(amountDollars) || amountDollars <= 0) {
    throw new Error("Enter a valid quote amount.");
  }

  const quote = await loadOwnedQuote(quoteId, session.user.id);
  if (quote.status !== "requested") {
    throw new Error("This lead has already been responded to.");
  }

  await db
    .update(quotes)
    .set({
      quotedAmountCents: Math.round(amountDollars * 100),
      paymentMode,
      status: "quoted",
      quotedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, quoteId));

  await notifyUser({
    userId: quote.ownerId,
    type: "quote.responded",
    title: "You got a quote",
    body: `$${amountDollars.toFixed(2)} — review it and schedule the job.`,
    link: "/owner/jobs",
  });

  revalidatePath("/provider/dashboard");
}

export async function declineQuote(formData: FormData) {
  const session = await requireRole("provider");
  const quoteId = String(formData.get("quoteId") ?? "");

  const quote = await loadOwnedQuote(quoteId, session.user.id);
  if (quote.status !== "requested") {
    throw new Error("This lead has already been responded to.");
  }

  await db
    .update(quotes)
    .set({ status: "declined", respondedAt: new Date(), updatedAt: new Date() })
    .where(eq(quotes.id, quoteId));

  await notifyUser({
    userId: quote.ownerId,
    type: "quote.responded",
    title: "Quote request declined",
    body: "This pro can't take on your request. Try another verified pro nearby.",
    link: "/discover",
  });

  revalidatePath("/provider/dashboard");
}

export async function toggleAcceptingLeads(formData: FormData) {
  const session = await requireRole("provider");
  const next = String(formData.get("next") ?? "") === "true";

  await db
    .update(providerProfiles)
    .set({ acceptingLeads: next, updatedAt: new Date() })
    .where(eq(providerProfiles.userId, session.user.id));

  revalidatePath("/provider/dashboard");
}
