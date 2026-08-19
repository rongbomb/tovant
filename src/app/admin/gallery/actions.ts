"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { providerGalleryPhotos } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";

export async function approveGalleryPhoto(formData: FormData) {
  const session = await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing photo id.");

  await db
    .update(providerGalleryPhotos)
    .set({
      status: "approved",
      rejectionReason: null,
      reviewedByAdminId: session.user.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(providerGalleryPhotos.id, id));

  revalidatePath("/admin/gallery");
}

export async function rejectGalleryPhoto(formData: FormData) {
  const session = await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) throw new Error("Missing photo id.");

  await db
    .update(providerGalleryPhotos)
    .set({
      status: "rejected",
      rejectionReason: reason || "Rejected by admin.",
      reviewedByAdminId: session.user.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(providerGalleryPhotos.id, id));

  revalidatePath("/admin/gallery");
}
