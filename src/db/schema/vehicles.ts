import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

// An owner's reusable "My Garage" list, referenced by quotes.vehicleId.
export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    nickname: text("nickname"),
    vin: text("vin"),
    mileage: integer("mileage"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("vehicles_owner_id_idx").on(t.ownerId)],
);
