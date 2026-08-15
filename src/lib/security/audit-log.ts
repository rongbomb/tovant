import "server-only";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import type { PgTransaction } from "drizzle-orm/pg-core";

export type AuditAction =
  | "provider.verification.approve"
  | "provider.verification.reject"
  | "payment.escrow.release"
  | "payment.escrow.refund"
  | "dispute.resolve"
  | "subscription.cancel";

/**
 * Append-only by convention — no code path here or elsewhere issues
 * UPDATE/DELETE against audit_log. Call this inside the same
 * db.transaction(...) as the state change it's recording, using `tx`
 * instead of the module-level `db`, so the mutation and its audit record
 * can never diverge.
 */
export async function writeAuditLog(
  entry: {
    actorUserId: string;
    action: AuditAction;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: PgTransaction<any, any, any> | typeof db = db,
) {
  await tx.insert(auditLog).values(entry);
}
