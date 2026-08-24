"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  providerCategoryTypes,
  providerSpecialtyTypes,
  serviceOfferingTypes,
  siteSettings,
} from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import type { SiteSettingKey } from "@/lib/site-settings";

const TAXONOMY_TABLES = {
  category: providerCategoryTypes,
  specialty: providerSpecialtyTypes,
  offering: serviceOfferingTypes,
} as const;

type TaxonomyKind = keyof typeof TAXONOMY_TABLES;

function slugify(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function addTaxonomyEntry(formData: FormData) {
  await requireRole("admin");
  const kind = String(formData.get("kind") ?? "") as TaxonomyKind;
  const label = String(formData.get("label") ?? "").trim();
  if (!(kind in TAXONOMY_TABLES)) throw new Error("Unknown taxonomy kind.");
  if (!label) throw new Error("Label is required.");

  const id = slugify(label);
  if (!id) throw new Error("Label must contain at least one letter or number.");

  if (kind === "offering") {
    const categoryId = String(formData.get("categoryId") ?? "");
    if (!categoryId) throw new Error("Choose which category this service offering belongs to.");
    const category = await db.query.providerCategoryTypes.findFirst({
      where: eq(providerCategoryTypes.id, categoryId),
    });
    if (!category) throw new Error("Unknown category.");
    await db.insert(serviceOfferingTypes).values({ id, label, categoryId });
  } else {
    const table = TAXONOMY_TABLES[kind];
    await db.insert(table).values({ id, label });
  }

  revalidatePath("/admin/settings");
}

export async function toggleTaxonomyActive(formData: FormData) {
  await requireRole("admin");
  const kind = String(formData.get("kind") ?? "") as TaxonomyKind;
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!(kind in TAXONOMY_TABLES)) throw new Error("Unknown taxonomy kind.");
  if (!id) throw new Error("Missing entry id.");

  const table = TAXONOMY_TABLES[kind];
  await db.update(table).set({ active: !active }).where(eq(table.id, id));

  revalidatePath("/admin/settings");
}

// Categories only — specialties/offerings have no owner-facing discovery
// entry point of their own to hide, so "coming soon" doesn't apply to them.
export async function toggleCategoryComingSoon(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const comingSoon = formData.get("comingSoon") === "true";
  if (!id) throw new Error("Missing entry id.");

  await db
    .update(providerCategoryTypes)
    .set({ comingSoon: !comingSoon })
    .where(eq(providerCategoryTypes.id, id));

  revalidatePath("/admin/settings");
}

export async function updateSiteSetting(formData: FormData) {
  const session = await requireRole("admin");
  const key = String(formData.get("key") ?? "") as SiteSettingKey;
  const valueRaw = formData.get("value");
  const value = Number(valueRaw);

  const KNOWN_KEYS = [
    "escrow_auto_release_hours",
    "default_cancellation_window_hours",
    "per_lead_fee_cents",
    "late_cancellation_fee_percent",
  ];
  if (!KNOWN_KEYS.includes(key)) {
    throw new Error("Unknown setting.");
  }
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Enter a positive number of hours.");
  }

  await db
    .insert(siteSettings)
    .values({ id: key, valueInt: Math.round(value), updatedByUserId: session.user.id })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { valueInt: Math.round(value), updatedByUserId: session.user.id, updatedAt: new Date() },
    });

  revalidatePath("/admin/settings");
}
