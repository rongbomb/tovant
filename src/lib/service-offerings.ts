import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceOfferingTypes } from "@/db/schema";

export type ServiceOffering = string;
export type ServiceOfferingOption = { value: string; label: string };

/** Active offerings only, for selection UI (checkboxes, etc). */
export async function getActiveServiceOfferings(): Promise<ServiceOfferingOption[]> {
  const rows = await db
    .select()
    .from(serviceOfferingTypes)
    .where(eq(serviceOfferingTypes.active, true))
    .orderBy(asc(serviceOfferingTypes.sortOrder));
  return rows.map((r) => ({ value: r.id, label: r.label }));
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
