import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  date,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { serviceModeEnum, verificationStatusEnum, verificationTypeEnum } from "./enums";
import { providerCategoryTypes, providerSpecialtyTypes, serviceOfferingTypes } from "./taxonomy";

export const providerProfiles = pgTable("provider_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),
  businessName: text("business_name"),
  bio: text("bio"),
  serviceMode: serviceModeEnum("service_mode").notNull().default("mobile"),
  shopAddressLine1: text("shop_address_line1"),
  shopCity: text("shop_city"),
  shopState: text("shop_state"),
  shopPostalCode: text("shop_postal_code"),
  serviceRadiusMiles: integer("service_radius_miles"),
  // Computed app-side: true only once all required verifications are
  // approved AND the subscription is active. Never set directly by a
  // provider-facing route.
  overallVerificationStatus: verificationStatusEnum("overall_verification_status")
    .notNull()
    .default("not_started"),
  isListable: boolean("is_listable").notNull().default(false),
  // The provider's own pause switch — separate from isListable above,
  // which reflects verification/subscription eligibility and is never
  // provider-settable. A verified, listable provider can still toggle
  // this off to stop receiving new leads without losing their listing.
  acceptingLeads: boolean("accepting_leads").notNull().default(true),
  ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }),
  ratingCount: integer("rating_count").notNull().default(0),
  hourlyRateCents: integer("hourly_rate_cents"),
  // Simple running total, incremented on each public profile render —
  // not a full analytics/events table.
  profileViewCount: integer("profile_view_count").notNull().default(0),
  stripeConnectAccountId: text("stripe_connect_account_id"),
  stripeConnectStatus: text("stripe_connect_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const providerCategories = pgTable(
  "provider_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    category: text("category")
      .notNull()
      .references(() => providerCategoryTypes.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.providerId, t.category)],
);

export const verificationRecords = pgTable(
  "verification_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    type: verificationTypeEnum("type").notNull(),
    // Set only when type = specialty_credential.
    specialty: text("specialty").references(() => providerSpecialtyTypes.id),
    status: verificationStatusEnum("status").notNull().default("not_started"),
    externalProvider: text("external_provider"), // 'stripe_identity' | 'checkr' | 'manual'
    externalReferenceId: text("external_reference_id"), // vendor session/report id — never doc content
    // S3 object key reference only. The raw document itself is never
    // stored in the database — see CLAUDE.md data-handling conventions.
    documentObjectKey: text("document_object_key"),
    reviewedByAdminId: text("reviewed_by_admin_id").references(() => user.id),
    reviewedAt: timestamp("reviewed_at"),
    rejectionReason: text("rejection_reason"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("verification_records_provider_type_status_idx").on(t.providerId, t.type, t.status)],
);

export const providerSpecialties = pgTable(
  "provider_specialties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    specialty: text("specialty")
      .notNull()
      .references(() => providerSpecialtyTypes.id),
    verificationRecordId: uuid("verification_record_id").references(
      () => verificationRecords.id,
    ),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.providerId, t.specialty)],
);

export const providerServiceOfferings = pgTable(
  "provider_service_offerings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    offering: text("offering")
      .notNull()
      .references(() => serviceOfferingTypes.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.providerId, t.offering)],
);

// A provider-declared "don't schedule me" marker for their own calendar
// planning — informational only, not enforced against booking (there's
// no live-availability booking engine per CLAUDE.md's scheduling model).
export const providerUnavailableDates = pgTable(
  "provider_unavailable_dates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.providerId, t.date)],
);
