"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs, payments } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import { getSiteSettingHours } from "@/lib/site-settings";

const NEXT_STATUS: Record<string, string> = {
  scheduled: "confirmed",
  confirmed: "in_progress",
  in_progress: "completed",
};

export async function advanceJob(formData: FormData) {
  const session = await requireRole("provider");
  const jobId = String(formData.get("jobId") ?? "");

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  if (!job || job.providerUserId !== session.user.id) {
    throw new Error("Job not found.");
  }

  const next = NEXT_STATUS[job.status];
  if (!next) {
    throw new Error("This job can't be advanced any further.");
  }

  const autoReleaseHours =
    next === "completed" ? await getSiteSettingHours("escrow_auto_release_hours") : null;

  await db.transaction(async (tx) => {
    await tx
      .update(jobs)
      .set({
        status: next as "confirmed" | "in_progress" | "completed",
        completedAt: next === "completed" ? new Date() : job.completedAt,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));

    // Wires CLAUDE.md's documented escrow rule: auto-release (default 72h,
    // admin-configurable at /admin/settings) from the moment the provider
    // marks the job complete, unless a dispute is opened. Actually
    // releasing the escrow (owner manual confirm, or a cron sweeping
    // autoReleaseAt) is separate follow-up work — this just records the
    // timestamps a release worker would act on.
    if (next === "completed" && autoReleaseHours !== null) {
      const now = new Date();
      const autoReleaseAt = new Date(now.getTime() + autoReleaseHours * 60 * 60 * 1000);
      await tx
        .update(payments)
        .set({ providerMarkedCompleteAt: now, autoReleaseAt, updatedAt: now })
        .where(eq(payments.jobId, jobId));
    }
  });

  revalidatePath("/provider/jobs");
  revalidatePath(`/provider/jobs/${jobId}`);
}
