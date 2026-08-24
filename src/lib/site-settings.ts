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
  // Cents charged to a provider the instant an owner sends them a quote
  // request (CLAUDE.md: "regardless of whether the provider responds").
  // Flat-rate placeholder — exact pricing (flat vs. variable by
  // category/specialty) is still an open product decision.
  per_lead_fee_cents: 1500,
  // Percent of the job's quoted amount charged as a late-cancellation fee
  // once the free-cancellation window has passed.
  late_cancellation_fee_percent: 20,
} as const;

export type SiteSettingKey = keyof typeof DEFAULTS;

export async function getSiteSettingHours(key: SiteSettingKey): Promise<number> {
  const row = await db.query.siteSettings.findFirst({ where: eq(siteSettings.id, key) });
  return row?.valueInt ?? DEFAULTS[key];
}

/** Same lookup, just named for call sites where the value isn't hours (cents, percent). */
export const getSiteSettingValue = getSiteSettingHours;
