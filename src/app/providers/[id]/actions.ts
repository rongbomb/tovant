"use server";

import "server-only";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { providerProfiles, providerCategories, quotes, vehicles } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";

export async function requestQuote(formData: FormData) {
  const session = await getSession();
  const providerId = String(formData.get("providerId") ?? "");
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== "owner") {
    redirect(`/login?next=/providers/${providerId}`);
  }

  const provider = await db.query.providerProfiles.findFirst({
    where: eq(providerProfiles.id, providerId),
  });
  if (!provider || !provider.isListable) {
    throw new Error("This pro isn't accepting quote requests right now.");
  }
  if (!provider.acceptingLeads) {
    throw new Error("This pro has paused new leads right now.");
  }

  const submittedCategory = String(formData.get("category") ?? "");
  const [validCategory] = await db
    .select()
    .from(providerCategories)
    .where(
      and(
        eq(providerCategories.providerId, providerId),
        eq(providerCategories.category, submittedCategory),
      ),
    );
  if (!validCategory) {
    throw new Error("Select a valid category for this pro.");
  }

  const description = String(formData.get("description") ?? "").trim();
  if (!description) throw new Error("Describe what's going on.");

  const vehicleIdRaw = String(formData.get("vehicleId") ?? "");
  let vehicleId: string | null = null;
  let vehicleInfo: { year: number; make: string; model: string; vin: string | null } | null = null;

  if (vehicleIdRaw) {
    const vehicle = await db.query.vehicles.findFirst({ where: eq(vehicles.id, vehicleIdRaw) });
    if (vehicle && vehicle.ownerId === session.user.id) {
      vehicleId = vehicle.id;
      vehicleInfo = {
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        vin: vehicle.vin,
      };
    }
  }

  await db.insert(quotes).values({
    ownerId: session.user.id,
    providerId: provider.id,
    providerUserId: provider.userId,
    category: submittedCategory,
    description,
    vehicleId,
    vehicleInfo,
    serviceMode: provider.serviceMode,
    status: "requested",
  });
}
