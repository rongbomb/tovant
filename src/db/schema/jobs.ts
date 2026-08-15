import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { providerProfiles } from "./providers";
import {
  providerCategoryEnum,
  serviceModeEnum,
  quoteStatusEnum,
  jobStatusEnum,
  paymentModeEnum,
} from "./enums";

// Owner -> single provider direct quote request (no open bidding).
export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id),
    // Denormalized alongside providerId so the shared ownership-check
    // helper (src/lib/security/ownership.ts) can work generically off
    // two plain user-id columns without a join.
    providerUserId: text("provider_user_id")
      .notNull()
      .references(() => user.id),
    category: providerCategoryEnum("category").notNull(),
    description: text("description").notNull(),
    vehicleInfo: jsonb("vehicle_info"), // { year, make, model, vin? }
    serviceMode: serviceModeEnum("service_mode").notNull(),
    serviceAddress: text("service_address"),
    status: quoteStatusEnum("status").notNull().default("requested"),
    quotedAmountCents: integer("quoted_amount_cents"),
    quotedAt: timestamp("quoted_at"),
    respondedAt: timestamp("responded_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("quotes_owner_id_idx").on(t.ownerId),
    index("quotes_provider_user_id_idx").on(t.providerUserId),
    index("quotes_status_idx").on(t.status),
  ],
);

// 1:1 with an accepted quote. No separate calendar table — the provider
// calendar view is just jobs filtered by providerUserId + scheduledAt.
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id)
      .unique(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id),
    providerUserId: text("provider_user_id")
      .notNull()
      .references(() => user.id),
    status: jobStatusEnum("status").notNull().default("scheduled"),
    scheduledAt: timestamp("scheduled_at").notNull(),
    completedAt: timestamp("completed_at"),
    paymentMode: paymentModeEnum("payment_mode").notNull(),
    cancellationWindowHours: integer("cancellation_window_hours")
      .notNull()
      .default(24),
    cancelledAt: timestamp("cancelled_at"),
    cancelledByUserId: text("cancelled_by_user_id").references(() => user.id),
    lateFeeCents: integer("late_fee_cents"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("jobs_owner_id_idx").on(t.ownerId),
    index("jobs_provider_user_id_idx").on(t.providerUserId),
    index("jobs_status_idx").on(t.status),
  ],
);
