import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { serviceOfferingTypes } from "@/db/schema";

export type ServiceOffering = string;
export type ServiceOfferingOption = { value: string; label: string; categoryId: string };

/** Active offerings only, for selection UI (checkboxes, etc). */
export async function getActiveServiceOfferings(): Promise<ServiceOfferingOption[]> {
  const rows = await db
    .select()
    .from(serviceOfferingTypes)
    .where(eq(serviceOfferingTypes.active, true))
    .orderBy(asc(serviceOfferingTypes.sortOrder));
  return rows.map((r) => ({ value: r.id, label: r.label, categoryId: r.categoryId }));
}

/**
 * Active offerings scoped to a specific set of category ids — what a
 * provider's own "Services" picker should show, since a provider selling
 * mechanic work shouldn't see detailing/tint offerings mixed into the same
 * checkbox grid, and vice versa.
 */
export async function getActiveServiceOfferingsForCategories(
  categoryIds: string[],
): Promise<ServiceOfferingOption[]> {
  if (categoryIds.length === 0) return [];
  const rows = await db
    .select()
    .from(serviceOfferingTypes)
    .where(and(eq(serviceOfferingTypes.active, true), inArray(serviceOfferingTypes.categoryId, categoryIds)))
    .orderBy(asc(serviceOfferingTypes.sortOrder));
  return rows.map((r) => ({ value: r.id, label: r.label, categoryId: r.categoryId }));
}

/**
 * All offerings, active and inactive, keyed by id — a provider row can
 * still reference an offering an admin later deactivated, and it still
 * needs a label wherever it's already displayed.
 */
export async function getServiceOfferingLabelMap(): Promise<Record<string, string>> {
  const rows = await db.select().from(serviceOfferingTypes);
  return Object.fromEntries(rows.map((r) => [r.id, r.label]));
}

export async function isValidServiceOffering(value: string): Promise<boolean> {
  const row = await db.query.serviceOfferingTypes.findFirst({
    where: eq(serviceOfferingTypes.id, value),
  });
  return Boolean(row);
}
