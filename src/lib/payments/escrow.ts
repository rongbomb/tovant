import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { payments, disputes, jobs } from "@/db/schema";
import { connectProvider } from "@/lib/integrations/registry";
import { writeAuditLog } from "@/lib/security/audit-log";
import { notifyUser } from "@/lib/notifications/notify";

const OPEN_DISPUTE_STATUSES = ["open", "under_review"] as const;

export async function hasOpenDispute(jobId: string): Promise<boolean> {
  const row = await db.query.disputes.findFirst({
    where: and(eq(disputes.jobId, jobId), inArray(disputes.status, [...OPEN_DISPUTE_STATUSES])),
  });
  return Boolean(row);
}

/**
 * Releases a captured in-app payment to the provider. Shared by the
 * owner's manual "release now" action and the cron-swept auto-release
 * route so the two can never drift — same guards, same audit trail, same
 * notifications either way. `releasedByUserId: null` means auto-released
 * (matches the column's documented meaning in src/db/schema/payments.ts).
 */
export async function releaseEscrow(paymentId: string, releasedByUserId: string | null) {
  const payment = await db.query.payments.findFirst({ where: eq(payments.id, paymentId) });
  if (!payment) throw new Error("Payment not found.");
  if (payment.mode !== "in_app") throw new Error("This job isn't paid in-app.");
  if (payment.escrowStatus !== "captured") {
    throw new Error("This payment isn't ready to release.");
  }
  if (await hasOpenDispute(payment.jobId)) {
    throw new Error("This job has an open dispute — it can't be released until that's resolved.");
  }
  if (!payment.stripePaymentIntentId) throw new Error("Missing payment record.");

  const { transferId } = await connectProvider.releaseToProvider(payment.stripePaymentIntentId);

  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({
        escrowStatus: "released",
        releasedAt: new Date(),
        releasedByUserId,
        stripeTransferId: transferId,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    await writeAuditLog(
      {
        // The audit log's actor must be a real user; auto-release has no
        // human actor, so it's attributed to the owner whose non-dispute
        // within the window is what authorized the release either way.
        actorUserId: releasedByUserId ?? payment.ownerId,
        action: "payment.escrow.release",
        targetType: "payment",
        targetId: paymentId,
        metadata: {
          jobId: payment.jobId,
          amountCents: payment.amountCents,
          trigger: releasedByUserId ? "owner_manual" : "auto_release",
        },
      },
      tx,
    );

    await notifyUser(
      {
        userId: payment.providerUserId,
        type: "payment.released",
        title: "Payment released",
        body: `$${((payment.amountCents ?? 0) / 100).toFixed(2)} has been released to you.`,
        link: `/provider/jobs/${payment.jobId}`,
      },
      tx,
    );
    await notifyUser(
      {
        userId: payment.ownerId,
        type: "payment.released",
        title: "Payment released",
        body: `Payment for your job has been released to the provider.`,
        link: `/owner/jobs/${payment.jobId}`,
      },
      tx,
    );
  });
}

/** Sweeps every payment past its auto-release deadline. Called by the cron route. */
export async function sweepAutoReleasablePayments(): Promise<{ released: number; skipped: number }> {
  const now = new Date();
  const candidates = await db
    .select()
    .from(payments)
    .where(and(eq(payments.escrowStatus, "captured"), eq(payments.mode, "in_app")));

  let released = 0;
  let skipped = 0;
  for (const payment of candidates) {
    if (!payment.autoReleaseAt || payment.autoReleaseAt > now) {
      skipped += 1;
      continue;
    }
    try {
      await releaseEscrow(payment.id, null);
      released += 1;
    } catch {
      skipped += 1;
    }
  }
  return { released, skipped };
}

/** Used by owner/jobs/[id]/actions.ts::openDispute to keep the job row's status accurate. */
export async function markJobDisputed(jobId: string) {
  await db.update(jobs).set({ status: "disputed", updatedAt: new Date() }).where(eq(jobs.id, jobId));
}
