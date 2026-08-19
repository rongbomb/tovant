"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { extname } from "path";
import { db } from "@/db";
import { providerProfiles, providerServiceOfferings, providerGalleryPhotos } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import { getActiveServiceOfferings } from "@/lib/service-offerings";
import { storageProvider } from "@/lib/integrations/registry";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function updateServiceOfferings(formData: FormData) {
  const session = await requireRole("provider");

  const provider = await db.query.providerProfiles.findFirst({
    where: eq(providerProfiles.userId, session.user.id),
  });
  if (!provider) throw new Error("Provider profile not found.");

  const activeOfferings = await getActiveServiceOfferings();
  const activeValues = new Set(activeOfferings.map((o) => o.value));
  const selected = formData
    .getAll("offering")
    .map(String)
    .filter((value) => activeValues.has(value));

  const rateRaw = formData.get("hourlyRate");
  const rateDollars = rateRaw ? Number(rateRaw) : null;
  const hourlyRateCents =
    rateDollars !== null && Number.isFinite(rateDollars) && rateDollars > 0
      ? Math.round(rateDollars * 100)
      : null;

  await db.transaction(async (tx) => {
    await tx
      .delete(providerServiceOfferings)
      .where(eq(providerServiceOfferings.providerId, provider.id));

    if (selected.length > 0) {
      await tx.insert(providerServiceOfferings).values(
        selected.map((offering) => ({
          providerId: provider.id,
          offering,
        })),
      );
    }

    await tx
      .update(providerProfiles)
      .set({ hourlyRateCents, updatedAt: new Date() })
      .where(eq(providerProfiles.id, provider.id));
  });

  revalidatePath("/provider/settings");
  revalidatePath(`/providers/${provider.id}`);
}

export async function uploadGalleryPhoto(formData: FormData) {
  const session = await requireRole("provider");

  const provider = await db.query.providerProfiles.findFirst({
    where: eq(providerProfiles.userId, session.user.id),
  });
  if (!provider) throw new Error("Provider profile not found.");

  const file = formData.get("file");
  const caption = formData.get("caption");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("An image file is required.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Image must be JPEG, PNG, or WebP.");
  }

  const ext = extname(file.name) || ".jpg";
  const objectKey = `gallery/${provider.id}/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await storageProvider.putObject(objectKey, buffer, file.type);

  await db.insert(providerGalleryPhotos).values({
    providerId: provider.id,
    objectKey,
    caption: typeof caption === "string" && caption.trim() ? caption.trim() : null,
    status: "pending",
  });

  revalidatePath("/provider/settings");
}
