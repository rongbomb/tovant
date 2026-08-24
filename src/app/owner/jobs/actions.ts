"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotes, jobs, payments } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import { getSiteSettingHours } from "@/lib/site-settings";
import { connectProvider } from "@/lib/integrations/registry";

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

  const job = await db.transaction(async (tx) => {
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
    return job;
  });

  // Manual-capture authorization: holds the funds now, captured later
  // (on job completion) and transferred to the provider on escrow release.
  // Stripe is stub-by-default, so this doesn't move real money without
  // live keys — see src/lib/integrations/registry.ts.
  const authorization =
    paymentMode === "in_app" && quote.quotedAmountCents
      ? await connectProvider.authorizePayment({ jobId: job.id, amountCents: quote.quotedAmountCents })
      : null;

  await db.insert(payments).values({
    jobId: job.id,
    ownerId: quote.ownerId,
    providerId: quote.providerId,
    providerUserId: quote.providerUserId,
    mode: paymentMode,
    amountCents: quote.quotedAmountCents,
    escrowStatus: authorization ? "authorized" : "not_applicable",
    stripePaymentIntentId: authorization?.paymentIntentId,
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
