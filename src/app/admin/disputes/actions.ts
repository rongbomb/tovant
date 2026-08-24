"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { disputes, jobs, payments } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import { connectProvider } from "@/lib/integrations/registry";
import { writeAuditLog } from "@/lib/security/audit-log";
import { notifyUser } from "@/lib/notifications/notify";

type Resolution = "release" | "refund" | "split" | "close";

/**
 * The one real resolution queue for design/ROADMAP.md Phase 8's disputes
 * table. Branches on the payment's current escrow state so it works
 * whether the dispute opened before or after the provider marked the job
 * complete — capture only happens if it hasn't already.
 */
export async function resolveDispute(formData: FormData) {
  const session = await requireRole("admin");
  const disputeId = String(formData.get("disputeId") ?? "");
  const resolution = String(formData.get("resolution") ?? "") as Resolution;
  const notes = String(formData.get("notes") ?? "").trim();
  const splitDollarsRaw = formData.get("splitToProviderDollars");
  const splitToProviderDollars = splitDollarsRaw ? Number(splitDollarsRaw) : null;

  if (!["release", "refund", "split", "close"].includes(resolution)) {
    throw new Error("Unknown resolution.");
  }

  const dispute = await db.query.disputes.findFirst({ where: eq(disputes.id, disputeId) });
  if (!dispute) throw new Error("Dispute not found.");
  if (dispute.status !== "open" && dispute.status !== "under_review") {
    throw new Error("This dispute is already resolved.");
  }

  const payment = await db.query.payments.findFirst({ where: eq(payments.jobId, dispute.jobId) });

  if (resolution !== "close" && payment?.mode === "in_app" && payment.stripePaymentIntentId) {
    // Ensure the funds are captured before moving any of them — a dispute
    // can open before the job was ever marked complete, in which case
    // nothing has been captured yet.
    if (payment.escrowStatus === "authorized") {
      await connectProvider.capturePayment(payment.stripePaymentIntentId);
    }

    if (resolution === "release") {
      const { transferId } = await connectProvider.releaseToProvider(payment.stripePaymentIntentId);
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
    } else if (resolution === "refund") {
      await connectProvider.refund(payment.stripePaymentIntentId);
      await db
        .update(payments)
        .set({ escrowStatus: "refunded", updatedAt: new Date() })
        .where(eq(payments.id, payment.id));
    } else if (resolution === "split") {
      const splitToProviderCents = Math.round((splitToProviderDollars ?? 0) * 100);
      if (!Number.isFinite(splitToProviderCents) || splitToProviderCents < 0) {
        throw new Error("Enter a valid split amount.");
      }
      const totalCents = payment.amountCents ?? 0;
      if (splitToProviderCents > totalCents) {
        throw new Error("Split amount can't exceed the job's total.");
      }
      const { transferId } = await connectProvider.releaseToProvider(
        payment.stripePaymentIntentId,
        splitToProviderCents,
      );
      const refundCents = totalCents - splitToProviderCents;
      if (refundCents > 0) {
        await connectProvider.refund(payment.stripePaymentIntentId, refundCents);
      }
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
    }
  } else if (resolution === "close" && payment?.mode === "in_app" && payment.escrowStatus === "captured") {
    // No financial action — restart the auto-release clock so the normal
    // hybrid release flow resumes as if the dispute never happened.
    await db
      .update(payments)
      .set({ autoReleaseAt: new Date(Date.now() + 72 * 60 * 60 * 1000), updatedAt: new Date() })
      .where(eq(payments.id, payment.id));
  }

  const DISPUTE_STATUS_BY_RESOLUTION = {
    release: "resolved_provider",
    refund: "resolved_owner",
    split: "resolved_split",
    close: "closed",
  } as const;
  const finalDisputeStatus = DISPUTE_STATUS_BY_RESOLUTION[resolution];
  const jobStatus = resolution === "refund" ? "cancelled" : "completed";

  await db.transaction(async (tx) => {
    await tx
      .update(disputes)
      .set({
        status: finalDisputeStatus,
        resolutionNotes: notes || null,
        resolvedByAdminId: session.user.id,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(disputes.id, disputeId));

    await tx.update(jobs).set({ status: jobStatus, updatedAt: new Date() }).where(eq(jobs.id, dispute.jobId));

    await writeAuditLog(
      {
        actorUserId: session.user.id,
        action: "dispute.resolve",
        targetType: "dispute",
        targetId: disputeId,
        metadata: { resolution, jobId: dispute.jobId, notes },
      },
      tx,
    );

    for (const userId of [dispute.ownerId, dispute.providerUserId]) {
      await notifyUser(
        {
          userId,
          type: "dispute.resolved",
          title: "Dispute resolved",
          body: `An admin resolved your dispute: ${resolution === "split" ? "payment split between you and the other party" : resolution}.`,
          link: userId === dispute.ownerId ? `/owner/jobs/${dispute.jobId}` : `/provider/jobs/${dispute.jobId}`,
        },
        tx,
      );
    }
  });

  revalidatePath("/admin/disputes");
}
