import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  serviceModeEnum,
  verificationStatusEnum,
  providerCategoryEnum,
  providerSpecialtyEnum,
  verificationTypeEnum,
} from "./enums";

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
  ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }),
  ratingCount: integer("rating_count").notNull().default(0),
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
    category: providerCategoryEnum("category").notNull(),
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
    specialty: providerSpecialtyEnum("specialty"),
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
    specialty: providerSpecialtyEnum("specialty").notNull(),
    verificationRecordId: uuid("verification_record_id").references(
      () => verificationRecords.id,
    ),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.providerId, t.specialty)],
);
