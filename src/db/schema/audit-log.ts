import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth";

// Append-only by convention: no app code path issues UPDATE/DELETE
// against this table. Every admin action that touches money or
// verification status writes here in the same transaction as the
// mutation — see src/lib/security/audit-log.ts.
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: text("actor_user_id")
    .notNull()
    .references(() => user.id),
  action: text("action").notNull(), // e.g. 'provider.verification.approve', 'payment.escrow.release'
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  // Structured context only — never raw PII/document content.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
