import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { providerProfiles } from "./providers";
import { jobs } from "./jobs";
import { disputeStatusEnum } from "./enums";

export const disputes = pgTable("disputes", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providerProfiles.id),
  providerUserId: text("provider_user_id")
    .notNull()
    .references(() => user.id),
  openedByUserId: text("opened_by_user_id")
    .notNull()
    .references(() => user.id),
  reason: text("reason").notNull(),
  status: disputeStatusEnum("status").notNull().default("open"),
  resolutionNotes: text("resolution_notes"),
  resolvedByAdminId: text("resolved_by_admin_id").references(() => user.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
