"use server";

import "server-only";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  user,
  providerProfiles,
  providerCategories,
  providerSpecialties,
  verificationRecords,
  providerCategoryTypes,
  providerSpecialtyTypes,
} from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";

export async function applyAsProvider(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login?next=/become-a-provider");

  const role = (session.user as { role?: string }).role ?? "owner";
  if (role !== "owner") {
    // Already a provider or an admin — nothing to apply for.
    redirect(role === "provider" ? "/provider/onboarding" : "/admin/dashboard");
  }

  const businessName = String(formData.get("businessName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const serviceModeRaw = String(formData.get("serviceMode") ?? "mobile");
  const serviceMode = ["mobile", "shop", "both"].includes(serviceModeRaw)
    ? (serviceModeRaw as "mobile" | "shop" | "both")
    : "mobile";
  const shopCity = String(formData.get("shopCity") ?? "").trim() || null;
  const shopState = String(formData.get("shopState") ?? "").trim() || null;
  const serviceRadiusRaw = formData.get("serviceRadiusMiles");
  const serviceRadiusMiles = serviceRadiusRaw ? Number(serviceRadiusRaw) : null;
  const consentToBackgroundCheck = formData.get("backgroundCheckConsent") === "on";

  const [activeCategories, activeSpecialties] = await Promise.all([
    db.select().from(providerCategoryTypes).where(eq(providerCategoryTypes.active, true)),
    db.select().from(providerSpecialtyTypes).where(eq(providerSpecialtyTypes.active, true)),
  ]);
  const validCategories = new Set(activeCategories.map((c) => c.id));
  const validSpecialties = new Set(activeSpecialties.map((s) => s.id));

  const categories = formData
    .getAll("category")
    .map(String)
    .filter((c) => validCategories.has(c));
  if (categories.length === 0) {
    throw new Error("Select at least one category.");
  }

  const specialties = formData
    .getAll("specialty")
    .map(String)
    .filter((s) => validSpecialties.has(s));

  await db.transaction(async (tx) => {
    await tx.update(user).set({ role: "provider" }).where(eq(user.id, session.user.id));

    const [provider] = await tx
      .insert(providerProfiles)
      .values({
        userId: session.user.id,
        businessName: businessName || null,
        bio: bio || null,
        serviceMode,
        shopCity,
        shopState,
        serviceRadiusMiles,
        overallVerificationStatus: "not_started",
        isListable: false,
      })
      .returning();

    if (categories.length > 0) {
      await tx.insert(providerCategories).values(categories.map((category) => ({ providerId: provider.id, category })));
    }
    if (specialties.length > 0) {
      await tx.insert(providerSpecialties).values(specialties.map((specialty) => ({ providerId: provider.id, specialty })));
    }
    if (consentToBackgroundCheck) {
      await tx.insert(verificationRecords).values({
        providerId: provider.id,
        type: "background_check",
        status: "pending",
        externalProvider: "checkr",
      });
    }
  });

  redirect("/provider/onboarding");
}
