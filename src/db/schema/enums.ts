import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["owner", "provider", "admin"]);

export const providerCategoryEnum = pgEnum("provider_category", [
  "mechanic",
  "detailer",
]);

export const providerSpecialtyEnum = pgEnum("provider_specialty", [
  "ev",
  "motorcycle_powersports",
  "commercial_fleet",
]);

export const serviceModeEnum = pgEnum("service_mode", ["mobile", "shop", "both"]);

export const verificationTypeEnum = pgEnum("verification_type", [
  "identity",
  "license",
  "insurance",
  "background_check",
  "specialty_credential",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "not_started",
  "pending",
  "in_review",
  "approved",
  "rejected",
  "expired",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "requested",
  "quoted",
  "accepted",
  "declined",
  "expired",
  "cancelled",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
]);

export const paymentModeEnum = pgEnum("payment_mode", ["in_app", "off_platform"]);

export const escrowStatusEnum = pgEnum("escrow_status", [
  "not_applicable",
  "authorized",
  "captured",
  "released",
  "refunded",
  "disputed",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
]);

export const disputeStatusEnum = pgEnum("dispute_status", [
  "open",
  "under_review",
  "resolved_owner",
  "resolved_provider",
  "resolved_split",
  "closed",
]);
