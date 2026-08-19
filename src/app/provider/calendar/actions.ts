"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { providerProfiles, providerUnavailableDates } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";

export async function toggleUnavailable(formData: FormData) {
  const session = await requireRole("provider");
  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date.");

  const provider = await db.query.providerProfiles.findFirst({
    where: eq(providerProfiles.userId, session.user.id),
  });
  if (!provider) throw new Error("Provider profile not found.");

  const existing = await db
    .select()
    .from(providerUnavailableDates)
    .where(
      and(eq(providerUnavailableDates.providerId, provider.id), eq(providerUnavailableDates.date, date)),
    );

  if (existing.length > 0) {
    await db
      .delete(providerUnavailableDates)
      .where(eq(providerUnavailableDates.id, existing[0].id));
  } else {
    await db.insert(providerUnavailableDates).values({ providerId: provider.id, date });
  }

  revalidatePath("/provider/calendar");
}
