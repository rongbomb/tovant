"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs, payments } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import { getSiteSettingHours } from "@/lib/site-settings";
import { connectProvider } from "@/lib/integrations/registry";
import { notifyUser } from "@/lib/notifications/notify";

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
  const payment =
    next === "completed" ? await db.query.payments.findFirst({ where: eq(payments.jobId, jobId) }) : null;

  // Capture happens outside the tx below (it's an external call) — done
  // first so the DB only ever records a capture that actually happened.
  if (payment && payment.mode === "in_app" && payment.stripePaymentIntentId) {
    await connectProvider.capturePayment(payment.stripePaymentIntentId);
  }

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
    // marks the job complete, unless a dispute is opened. The cron route
    // (src/app/api/cron/release-escrow/route.ts) is what actually sweeps
    // autoReleaseAt; this just records the timestamp it acts on.
    if (next === "completed" && autoReleaseHours !== null) {
      const now = new Date();
      const autoReleaseAt = new Date(now.getTime() + autoReleaseHours * 60 * 60 * 1000);
      await tx
        .update(payments)
        .set({
          providerMarkedCompleteAt: now,
          autoReleaseAt,
          escrowStatus: payment?.mode === "in_app" ? "captured" : payment?.escrowStatus,
          updatedAt: now,
        })
        .where(eq(payments.jobId, jobId));
    }

    if (next === "completed") {
      await notifyUser(
        {
          userId: job.ownerId,
          type: "job.completed",
          title: "Job marked complete",
          body: "Your provider marked this job complete. Confirm to release payment now, or it auto-releases automatically.",
          link: `/owner/jobs/${jobId}`,
        },
        tx,
      );
    }
  });

  revalidatePath("/provider/jobs");
  revalidatePath(`/provider/jobs/${jobId}`);
}
