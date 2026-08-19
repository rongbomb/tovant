"use server";

import "server-only";
import { mkdir, writeFile } from "fs/promises";
import { join, extname } from "path";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { homepageImages } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import { HOMEPAGE_IMAGE_SLOTS, type HomepageImageSlot } from "@/lib/homepage-images";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "homepage");

export async function updateHomepageImage(formData: FormData) {
  const session = await requireRole("admin");

  const slot = formData.get("slot");
  const altText = formData.get("altText");
  const file = formData.get("file");

  if (typeof slot !== "string" || !HOMEPAGE_IMAGE_SLOTS.some((s) => s.slot === slot)) {
    throw new Error("Unknown homepage image slot.");
  }
  if (typeof altText !== "string" || altText.trim().length === 0) {
    throw new Error("Alt text is required.");
  }
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
  const filename = `${slot}-${Date.now()}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));

  const imagePath = `/uploads/homepage/${filename}`;

  await db
    .insert(homepageImages)
    .values({
      slot: slot as HomepageImageSlot,
      imagePath,
      altText: altText.trim(),
      updatedByUserId: session.user.id,
    })
    .onConflictDoUpdate({
      target: homepageImages.slot,
      set: {
        imagePath,
        altText: altText.trim(),
        updatedByUserId: session.user.id,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/");
  revalidatePath("/admin/settings");
}
