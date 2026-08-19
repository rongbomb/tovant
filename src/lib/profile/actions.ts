"use server";

import "server-only";
import { randomUUID } from "crypto";
import { extname } from "path";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, user } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { storageProvider } from "@/lib/integrations/registry";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function updateProfile(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in.");

  const displayName = String(formData.get("displayName") ?? "").trim();
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  await db
    .insert(profiles)
    .values({
      userId: session.user.id,
      displayName: displayName || null,
      addressLine1: addressLine1 || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        displayName: displayName || null,
        addressLine1: addressLine1 || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
        updatedAt: new Date(),
      },
    });

  await db.update(user).set({ phone: phone || null }).where(eq(user.id, session.user.id));

  revalidatePath("/owner/settings");
  revalidatePath("/provider/settings");
}

export async function uploadAvatar(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in.");

  const file = formData.get("file");
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
  const objectKey = `avatars/${session.user.id}/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await storageProvider.putObject(objectKey, buffer, file.type);

  await db
    .insert(profiles)
    .values({ userId: session.user.id, avatarObjectKey: objectKey })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { avatarObjectKey: objectKey, updatedAt: new Date() },
    });

  revalidatePath("/owner/settings");
  revalidatePath("/provider/settings");
}
