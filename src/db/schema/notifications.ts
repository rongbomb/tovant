import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

// In-app only for now (per design/ROADMAP.md Phase 4) — email/SMS dispatch
// for the same events is a reserved-but-separate follow-up, not built here.
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // e.g. 'lead.new', 'quote.responded', 'payment.released', 'review.received',
    // 'verification.decided', 'dispute.opened', 'dispute.resolved'.
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    // In-app route to deep-link into, e.g. `/provider/jobs/{id}`.
    link: text("link"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("notifications_user_id_read_at_idx").on(t.userId, t.readAt)],
);
