import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

// Scoped to exactly the two hardcoded numbers a prior audit found — not a
// speculative generic settings system. Falls back to the value that used
// to be the hardcode if the row is somehow missing, so a fresh/unseeded
// DB never breaks the escrow or cancellation flow it backs.
const DEFAULTS = {
  escrow_auto_release_hours: 72,
  default_cancellation_window_hours: 24,
} as const;

export type SiteSettingKey = keyof typeof DEFAULTS;

export async function getSiteSettingHours(key: SiteSettingKey): Promise<number> {
  const row = await db.query.siteSettings.findFirst({ where: eq(siteSettings.id, key) });
  return row?.valueInt ?? DEFAULTS[key];
}
