import "server-only";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import type { PgTransaction } from "drizzle-orm/pg-core";

export type NotificationType =
  | "lead.new"
  | "quote.responded"
  | "payment.released"
  | "review.received"
  | "verification.decided"
  | "dispute.opened"
  | "dispute.resolved"
  | "job.completed"
  | "job.cancelled";

/**
 * Server-side only — takes a raw transaction object, so this can never be a
 * "use server" action itself (those require serializable args/return
 * values). Call inside the same db.transaction(...) as the event that
 * triggered it when there is one (mirrors writeAuditLog's tx-passing
 * convention), so a notification never appears for a mutation that itself
 * rolled back. The client-facing read/mark-read API lives in
 * src/app/notifications/actions.ts.
 */
export async function notifyUser(
  entry: { userId: string; type: NotificationType; title: string; body: string; link?: string },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: PgTransaction<any, any, any> | typeof db = db,
) {
  await tx.insert(notifications).values(entry);
}
