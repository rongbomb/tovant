import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { providerProfiles } from "./providers";
import { jobs } from "./jobs";
import { paymentModeEnum, escrowStatusEnum, subscriptionStatusEnum } from "./enums";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id)
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
    mode: paymentModeEnum("mode").notNull(),
    amountCents: integer("amount_cents"),
    currency: text("currency").notNull().default("usd"),
    // Stays 'not_applicable' for off_platform jobs.
    escrowStatus: escrowStatusEnum("escrow_status").notNull().default("not_applicable"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeTransferId: text("stripe_transfer_id"),
    providerMarkedCompleteAt: timestamp("provider_marked_complete_at"),
    // providerMarkedCompleteAt + 72h, computed on write so the
    // auto-release job is a trivial `autoReleaseAt <= now()` scan.
    autoReleaseAt: timestamp("auto_release_at"),
    releasedAt: timestamp("released_at"),
    // null => auto-released rather than manually confirmed by the owner.
    releasedByUserId: text("released_by_user_id").references(() => user.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("payments_owner_id_idx").on(t.ownerId),
    index("payments_provider_user_id_idx").on(t.providerUserId),
    index("payments_auto_release_at_idx").on(t.autoReleaseAt),
  ],
);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providerProfiles.id)
    .unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: subscriptionStatusEnum("status").notNull().default("incomplete"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
