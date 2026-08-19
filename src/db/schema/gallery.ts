import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { providerProfiles } from "./providers";
import { galleryPhotoStatusEnum } from "./enums";

// Provider-submitted "recent work" photos, untrusted until an admin
// approves them — object storage (not the homepage's public/uploads
// shortcut), served through a status-gated route. See
// src/app/api/gallery-photos/[id]/image/route.ts.
export const providerGalleryPhotos = pgTable(
  "provider_gallery_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull(),
    caption: text("caption"),
    status: galleryPhotoStatusEnum("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    reviewedByAdminId: text("reviewed_by_admin_id").references(() => user.id),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("gallery_photos_provider_status_idx").on(t.providerId, t.status),
    index("gallery_photos_status_created_at_idx").on(t.status, t.createdAt),
  ],
);
