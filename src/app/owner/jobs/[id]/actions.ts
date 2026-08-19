"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq, avg, count } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { jobs, reviews, providerProfiles } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";

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
    }
    await recomputeProviderRating(tx, job.providerId);
  });

  revalidatePath(`/owner/jobs/${jobId}`);
}
