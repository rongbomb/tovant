import { pgTable, uuid, text, integer, timestamp, unique, index } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { providerProfiles } from "./providers";
import { jobs } from "./jobs";

// One review per job (not per provider) — an owner with several completed
// jobs from the same provider can leave a review each time. Eligibility
// (job.status is 'completed' or 'disputed') and the rating/comment author
// check live in src/app/owner/jobs/[id]/actions.ts, not here.
export const reviews = pgTable(
  "reviews",
  {
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
    rating: integer("rating").notNull(), // 1-5, app-validated
    comment: text("comment").notNull(),
    // Set on first edit; createdAt stays the original submission time.
    editedAt: timestamp("edited_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.jobId),
    index("reviews_provider_id_idx").on(t.providerId),
    index("reviews_owner_id_idx").on(t.ownerId),
  ],
);
