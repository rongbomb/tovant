import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { user } from "./auth";

// Admin-editable images for the marketing homepage. Rows are optional per
// slot — src/lib/homepage-images.ts falls back to a committed default in
// public/images/homepage/ for any slot with no row yet, so the homepage
// never breaks before an admin has uploaded a replacement.
export const homepageImages = pgTable("homepage_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  slot: text("slot").notNull().unique(),
  imagePath: text("image_path").notNull(),
  altText: text("alt_text").notNull(),
  updatedByUserId: text("updated_by_user_id").references(() => user.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// A small, scoped key-value table for the exact numeric business rules the
// audit found hardcoded — not a speculative generic settings system. `id`
// is the setting key (e.g. "escrow_auto_release_hours").
export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey(),
  valueInt: integer("value_int").notNull(),
  updatedByUserId: text("updated_by_user_id").references(() => user.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
