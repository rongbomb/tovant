import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { providerProfiles, providerSpecialties, verificationRecords } from "@/db/schema";
import type { PgTransaction } from "drizzle-orm/pg-core";

const REQUIRED_TYPES = ["identity", "license", "insurance", "background_check"] as const;

// Higher = more blocking. Used to pick the single overall status to show
// when a provider isn't fully approved yet.
const STATUS_PRIORITY: Record<string, number> = {
  not_started: 0,
  pending: 1,
  in_review: 2,
  expired: 3,
  rejected: 4,
};

/**
 * The only code path that ever writes providerProfiles.isListable /
 * .overallVerificationStatus — everywhere else treats them as read-only,
 * computed values. Call this inside the same transaction as any
 * verification-record change so the two can never drift apart.
 */
export async function recomputeProviderListability(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: PgTransaction<any, any, any> | typeof db,
  providerId: string,
) {
  const [records, specialties] = await Promise.all([
    tx.select().from(verificationRecords).where(eq(verificationRecords.providerId, providerId)),
    tx.select().from(providerSpecialties).where(eq(providerSpecialties.providerId, providerId)),
  ]);

  // Upload logic (uploadVerificationDocument) only ever leaves at most one
  // record per (type[, specialty]) combo alive at a time — an approved one
  // blocks new uploads outright — so picking any match is unambiguous.
  const requirements: { status: string }[] = REQUIRED_TYPES.map((type) => {
    const match = records.find((r) => r.type === type);
    return { status: match?.status ?? "not_started" };
  });

  for (const specialty of specialties) {
    const match = records.find(
      (r) => r.type === "specialty_credential" && r.specialty === specialty.specialty,
    );
    requirements.push({ status: match?.status ?? "not_started" });
  }

  const allApproved = requirements.every((r) => r.status === "approved");
  const overallStatus = allApproved
    ? "approved"
    : requirements
        .filter((r) => r.status !== "approved")
        .reduce((worst, r) => (STATUS_PRIORITY[r.status] > STATUS_PRIORITY[worst] ? r.status : worst), "not_started");

  await tx
    .update(providerProfiles)
    .set({
      isListable: allApproved,
      overallVerificationStatus: overallStatus as typeof providerProfiles.$inferInsert.overallVerificationStatus,
      updatedAt: new Date(),
    })
    .where(eq(providerProfiles.id, providerId));
}
