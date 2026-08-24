import "server-only";
import { db } from "@/db";
import { providerCategoryTypes, providerSpecialtyTypes } from "@/db/schema";

/**
 * All category/specialty labels, active and inactive, keyed by id — mirrors
 * getServiceOfferingLabelMap in service-offerings.ts. A provider row can
 * still reference a category/specialty an admin later deactivated, and
 * public pages must never fall back to rendering the raw slug (e.g.
 * "upgrades_fabrication") since that's what admin-added taxonomy entries
 * would otherwise show as instead of their real label.
 */
export async function getCategoryLabelMap(): Promise<Record<string, string>> {
  const rows = await db.select().from(providerCategoryTypes);
  return Object.fromEntries(rows.map((r) => [r.id, r.label]));
}

export async function getSpecialtyLabelMap(): Promise<Record<string, string>> {
  const rows = await db.select().from(providerSpecialtyTypes);
  return Object.fromEntries(rows.map((r) => [r.id, r.label]));
}
