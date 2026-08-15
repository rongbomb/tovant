import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { quotes } from "./jobs";
import { jobs } from "./jobs";

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteId: uuid("quote_id").references(() => quotes.id, {
      onDelete: "cascade",
    }), // pre-job messaging
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => user.id),
    body: text("body").notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("messages_quote_id_idx").on(t.quoteId),
    index("messages_job_id_idx").on(t.jobId),
  ],
);
