"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq, avg, count } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { jobs, reviews, providerProfiles, payments, disputes } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import { releaseEscrow, hasOpenDispute, markJobDisputed } from "@/lib/payments/escrow";
import { connectProvider } from "@/lib/integrations/registry";
import { notifyUser } from "@/lib/notifications/notify";
import { getSiteSettingValue } from "@/lib/site-settings";

const REVIEWABLE_STATUSES = new Set(["completed", "disputed"]);

async function recomputeProviderRating(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: PgTransaction<any, any, any>,
  providerId: string,
) {
  const [agg] = await tx
    .select({ avgRating: avg(reviews.rating), reviewCount: count() })
    .from(reviews)
    .where(eq(reviews.providerId, providerId));

  await tx
    .update(providerProfiles)
    .set({
      ratingAvg: agg.avgRating,
      ratingCount: agg.reviewCount,
      updatedAt: new Date(),
    })
    .where(eq(providerProfiles.id, providerId));
}

export async function saveReview(formData: FormData) {
  const session = await requireRole("owner");

  const jobId = String(formData.get("jobId") ?? "");
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim();

  if (!jobId) throw new Error("Missing job id.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }
  if (!comment) throw new Error("A comment is required.");

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  if (!job || job.ownerId !== session.user.id) {
    throw new Error("Job not found.");
  }
  if (!REVIEWABLE_STATUSES.has(job.status)) {
    throw new Error("This job isn't eligible for a review yet.");
  }

  const existing = await db.query.reviews.findFirst({ where: eq(reviews.jobId, jobId) });

  await db.transaction(async (tx) => {
    if (existing) {
      await tx
        .update(reviews)
        .set({ rating, comment, editedAt: new Date(), updatedAt: new Date() })
        .where(eq(reviews.id, existing.id));
    } else {
      await tx.insert(reviews).values({
        jobId,
        ownerId: job.ownerId,
        providerId: job.providerId,
        providerUserId: job.providerUserId,
        rating,
        comment,
      });
      await notifyUser(
        {
          userId: job.providerUserId,
          type: "review.received",
          title: "New review",
          body: `You got a ${rating}-star review.`,
          link: "/provider/reviews",
        },
        tx,
      );
    }
    await recomputeProviderRating(tx, job.providerId);
  });

  revalidatePath(`/owner/jobs/${jobId}`);
}

/** Owner's manual "release now" — the other half of the hybrid escrow-release rule (auto-release is the cron route). */
export async function releaseEscrowNow(formData: FormData) {
  const session = await requireRole("owner");
  const jobId = String(formData.get("jobId") ?? "");

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  if (!job || job.ownerId !== session.user.id) throw new Error("Job not found.");

  const payment = await db.query.payments.findFirst({ where: eq(payments.jobId, jobId) });
  if (!payment) throw new Error("No payment on this job.");

  await releaseEscrow(payment.id, session.user.id);

  revalidatePath(`/owner/jobs/${jobId}`);
  revalidatePath("/owner/jobs");
}

/**
 * Owner-facing dispute path (design/ROADMAP.md Phase 8). Admin resolution
 * lives at /admin/disputes (src/app/admin/disputes/actions.ts) — this only
 * opens one and freezes the job/payment so neither side can move money
 * while it's under review.
 */
export async function openDispute(formData: FormData) {
  const session = await requireRole("owner");
  const jobId = String(formData.get("jobId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Describe what went wrong.");

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  if (!job || job.ownerId !== session.user.id) throw new Error("Job not found.");
  if (!["scheduled", "confirmed", "in_progress", "completed"].includes(job.status)) {
    throw new Error("This job can't be disputed.");
  }
  if (await hasOpenDispute(jobId)) {
    throw new Error("A dispute is already open on this job.");
  }

  await db.transaction(async (tx) => {
    await tx.insert(disputes).values({
      jobId,
      ownerId: job.ownerId,
      providerId: job.providerId,
      providerUserId: job.providerUserId,
      openedByUserId: session.user.id,
      reason,
      status: "open",
    });

    await notifyUser(
      {
        userId: job.providerUserId,
        type: "dispute.opened",
        title: "Dispute opened",
        body: "The owner opened a dispute on a job — payment is on hold until an admin resolves it.",
        link: `/provider/jobs/${jobId}`,
      },
      tx,
    );
  });

  await markJobDisputed(jobId);

  revalidatePath(`/owner/jobs/${jobId}`);
}

/**
 * Free within job.cancellationWindowHours of the scheduled time, a
 * percentage-of-quote late fee after (CLAUDE.md's cancellation policy).
 * In-app jobs: the fee (if any) is captured from the existing
 * authorization and transferred to the provider; the rest of the hold
 * releases automatically since it's never captured. Off-platform jobs:
 * no funds ever moved through Tovant, so the fee is informational only —
 * the provider collects it directly.
 */
export async function cancelJob(formData: FormData) {
  const session = await requireRole("owner");
  const jobId = String(formData.get("jobId") ?? "");

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  if (!job || job.ownerId !== session.user.id) throw new Error("Job not found.");
  if (!["scheduled", "confirmed"].includes(job.status)) {
    throw new Error("This job can no longer be cancelled.");
  }

  const hoursUntilScheduled = (job.scheduledAt.getTime() - Date.now()) / (60 * 60 * 1000);
  const isLate = hoursUntilScheduled < job.cancellationWindowHours;

  const payment = await db.query.payments.findFirst({ where: eq(payments.jobId, jobId) });
  const feePercent = isLate ? await getSiteSettingValue("late_cancellation_fee_percent") : 0;
  const lateFeeCents =
    isLate && payment?.amountCents ? Math.round((payment.amountCents * feePercent) / 100) : 0;

  if (payment?.mode === "in_app" && payment.stripePaymentIntentId && lateFeeCents > 0) {
    await connectProvider.capturePayment(payment.stripePaymentIntentId, lateFeeCents);
    const { transferId } = await connectProvider.releaseToProvider(
      payment.stripePaymentIntentId,
      lateFeeCents,
    );
    await db
      .update(payments)
      .set({
        escrowStatus: "released",
        releasedAt: new Date(),
        releasedByUserId: session.user.id,
        stripeTransferId: transferId,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));
  } else if (payment?.mode === "in_app" && payment.escrowStatus === "authorized") {
    // Nothing captured — the uncaptured hold releases back to the owner's
    // card on its own; this just marks the record so it stops showing as
    // an open authorization.
    await db
      .update(payments)
      .set({ escrowStatus: "refunded", updatedAt: new Date() })
      .where(eq(payments.id, payment.id));
  }

  await db
    .update(jobs)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledByUserId: session.user.id,
      lateFeeCents: lateFeeCents || null,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

  await notifyUser({
    userId: job.providerUserId,
    type: "job.cancelled",
    title: "Job cancelled",
    body:
      lateFeeCents > 0
        ? `The owner cancelled outside the free-cancellation window — a $${(lateFeeCents / 100).toFixed(2)} late fee applies.`
        : "The owner cancelled this job.",
    link: `/provider/jobs/${jobId}`,
  });

  revalidatePath(`/owner/jobs/${jobId}`);
  revalidatePath("/owner/jobs");
}
