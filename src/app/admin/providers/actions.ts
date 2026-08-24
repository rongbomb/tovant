"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { verificationRecords, providerProfiles } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import { writeAuditLog } from "@/lib/security/audit-log";
import { recomputeProviderListability } from "@/lib/providers/verification";
import { notifyUser } from "@/lib/notifications/notify";

export async function approveVerificationRecord(formData: FormData) {
  const session = await requireRole("admin");
  const recordId = String(formData.get("recordId") ?? "");
  if (!recordId) throw new Error("Missing record id.");

  await db.transaction(async (tx) => {
    const record = await tx.query.verificationRecords.findFirst({
      where: eq(verificationRecords.id, recordId),
    });
    if (!record) throw new Error("Verification record not found.");

    await tx
      .update(verificationRecords)
      .set({
        status: "approved",
        rejectionReason: null,
        reviewedByAdminId: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(verificationRecords.id, recordId));

    await writeAuditLog(
      {
        actorUserId: session.user.id,
        action: "provider.verification.approve",
        targetType: "verification_record",
        targetId: recordId,
        metadata: { providerId: record.providerId, type: record.type, specialty: record.specialty },
      },
      tx,
    );

    await recomputeProviderListability(tx, record.providerId);

    const provider = await tx.query.providerProfiles.findFirst({
      where: eq(providerProfiles.id, record.providerId),
    });
    if (provider) {
      await notifyUser(
        {
          userId: provider.userId,
          type: "verification.decided",
          title: "Verification approved",
          body: `Your ${record.type.replace("_", " ")} was approved.`,
          link: "/provider/onboarding",
        },
        tx,
      );
    }
  });

  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${formData.get("providerId")}`);
}

export async function rejectVerificationRecord(formData: FormData) {
  const session = await requireRole("admin");
  const recordId = String(formData.get("recordId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!recordId) throw new Error("Missing record id.");

  await db.transaction(async (tx) => {
    const record = await tx.query.verificationRecords.findFirst({
      where: eq(verificationRecords.id, recordId),
    });
    if (!record) throw new Error("Verification record not found.");

    await tx
      .update(verificationRecords)
      .set({
        status: "rejected",
        rejectionReason: reason || "Rejected by admin.",
        reviewedByAdminId: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(verificationRecords.id, recordId));

    await writeAuditLog(
      {
        actorUserId: session.user.id,
        action: "provider.verification.reject",
        targetType: "verification_record",
        targetId: recordId,
        metadata: { providerId: record.providerId, type: record.type, specialty: record.specialty, reason },
      },
      tx,
    );

    await recomputeProviderListability(tx, record.providerId);

    const provider = await tx.query.providerProfiles.findFirst({
      where: eq(providerProfiles.id, record.providerId),
    });
    if (provider) {
      await notifyUser(
        {
          userId: provider.userId,
          type: "verification.decided",
          title: "Verification needs attention",
          body: `Your ${record.type.replace("_", " ")} was rejected: ${reason || "see onboarding for details"}.`,
          link: "/provider/onboarding",
        },
        tx,
      );
    }
  });

  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${formData.get("providerId")}`);
}
