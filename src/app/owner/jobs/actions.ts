"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotes, jobs, payments } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import { getSiteSettingHours } from "@/lib/site-settings";

export async function acceptQuote(formData: FormData) {
  const session = await requireRole("owner");
  const quoteId = String(formData.get("quoteId") ?? "");
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "");

  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, quoteId) });
  if (!quote || quote.ownerId !== session.user.id) {
    throw new Error("Quote not found.");
  }
  if (quote.status !== "quoted") {
    throw new Error("This quote isn't ready to accept.");
  }

  const scheduledAt = new Date(scheduledAtRaw);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now()) {
    throw new Error("Pick a valid, upcoming date and time.");
  }

  const paymentMode = quote.paymentMode ?? "off_platform";
  const cancellationWindowHours = await getSiteSettingHours("default_cancellation_window_hours");

  await db.transaction(async (tx) => {
    await tx
      .update(quotes)
      .set({ status: "accepted", respondedAt: new Date(), updatedAt: new Date() })
      .where(eq(quotes.id, quoteId));

    const [job] = await tx
      .insert(jobs)
      .values({
        quoteId: quote.id,
        ownerId: quote.ownerId,
        providerId: quote.providerId,
        providerUserId: quote.providerUserId,
        status: "scheduled",
        scheduledAt,
        paymentMode,
        cancellationWindowHours,
      })
      .returning();

    // Simulates the stubbed Stripe manual-capture authorization succeeding
    // — no real charge fires (Stripe is stub-by-default), but the escrow
    // state is recorded so the rest of the payment/escrow flow has real
    // data to work against.
    await tx.insert(payments).values({
      jobId: job.id,
      ownerId: quote.ownerId,
      providerId: quote.providerId,
      providerUserId: quote.providerUserId,
      mode: paymentMode,
      amountCents: quote.quotedAmountCents,
      escrowStatus: paymentMode === "in_app" ? "authorized" : "not_applicable",
    });
  });

  revalidatePath("/owner/jobs");
}

export async function declineQuote(formData: FormData) {
  const session = await requireRole("owner");
  const quoteId = String(formData.get("quoteId") ?? "");

  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, quoteId) });
  if (!quote || quote.ownerId !== session.user.id) {
    throw new Error("Quote not found.");
  }
  if (quote.status !== "quoted" && quote.status !== "requested") {
    throw new Error("This quote can't be declined anymore.");
  }

  await db
    .update(quotes)
    .set({ status: "declined", respondedAt: new Date(), updatedAt: new Date() })
    .where(eq(quotes.id, quoteId));

  revalidatePath("/owner/jobs");
}
