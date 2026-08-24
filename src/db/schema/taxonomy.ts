import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// Admin-editable lookup tables for the three *taxonomy* enums (categories,
// specialties, service offerings) — see CLAUDE.md for why these three and
// not the state-machine enums (job_status, quote_status, etc.), which stay
// hardcoded pgEnum types. `id` is the stable slug (what used to be the enum
// value, e.g. "mechanic") so existing FK data survives the enum -> text
// migration unchanged. Rows are deactivated, never deleted — existing FKs
// would orphan otherwise.
export const providerCategoryTypes = pgTable("provider_category_types", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  // Distinct from `active`: a coming-soon category still exists (an admin
  // can pre-add it, providers can pre-register interest in it at
  // become-a-provider) but is hidden from owner-facing discovery entry
  // points (homepage cards, /discover's filter) until the pilot expands
  // beyond mechanics/mobile mechanics. `active=false` remains "fully
  // retired"; this flag is "not open yet."
  comingSoon: boolean("coming_soon").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const providerSpecialtyTypes = pgTable("provider_specialty_types", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const serviceOfferingTypes = pgTable("service_offering_types", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  // Which category this offering belongs to (e.g. "brakes" -> mechanic,
  // "exterior_detailing" -> detailer). Without this every offering was one
  // flat list shared by every provider regardless of category, which stops
  // being usable once more than one or two categories are active — a
  // mechanic and a detailer would see each other's checkboxes.
  categoryId: text("category_id")
    .notNull()
    .references(() => providerCategoryTypes.id),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
