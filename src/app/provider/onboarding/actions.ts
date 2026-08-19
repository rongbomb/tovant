"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { extname } from "path";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { providerProfiles, providerSpecialtyTypes, verificationRecords } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import { storageProvider } from "@/lib/integrations/registry";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const VALID_TYPES = new Set(["identity", "license", "insurance", "specialty_credential"]);

export async function uploadVerificationDocument(formData: FormData) {
  const session = await requireRole("provider");

  const provider = await db.query.providerProfiles.findFirst({
    where: eq(providerProfiles.userId, session.user.id),
  });
  if (!provider) throw new Error("Provider profile not found.");

  const type = String(formData.get("type") ?? "");
  if (!VALID_TYPES.has(type)) throw new Error("Unknown document type.");

  const specialtyRaw = formData.get("specialty");
  let specialty: string | null = null;
  if (type === "specialty_credential") {
    if (typeof specialtyRaw !== "string" || !specialtyRaw) {
      throw new Error("Missing specialty for this credential.");
    }
    const validSpecialty = await db.query.providerSpecialtyTypes.findFirst({
      where: eq(providerSpecialtyTypes.id, specialtyRaw),
    });
    if (!validSpecialty) throw new Error("Unknown specialty.");
    specialty = validSpecialty.id;
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("A document file is required.");
  if (file.size > MAX_BYTES) throw new Error("File must be 5MB or smaller.");
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("File must be JPEG, PNG, WebP, or PDF.");

  const matchConditions = [
    eq(verificationRecords.providerId, provider.id),
    eq(verificationRecords.type, type as "identity" | "license" | "insurance" | "specialty_credential"),
  ];
  if (specialty) matchConditions.push(eq(verificationRecords.specialty, specialty));

  const existing = await db
    .select()
    .from(verificationRecords)
    .where(and(...matchConditions));

  if (existing.some((r) => r.status === "approved")) {
    throw new Error("This credential is already approved — contact support to update it.");
  }

  const ext = extname(file.name) || ".jpg";
  const objectKey = `verification/${provider.id}/${type}${specialty ? `-${specialty}` : ""}/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await storageProvider.putObject(objectKey, buffer, file.type);

  await db.transaction(async (tx) => {
    for (const row of existing) {
      await tx.delete(verificationRecords).where(eq(verificationRecords.id, row.id));
    }
    await tx.insert(verificationRecords).values({
      providerId: provider.id,
      type: type as "identity" | "license" | "insurance" | "specialty_credential",
      specialty,
      status: "pending",
      documentObjectKey: objectKey,
    });
  });

  revalidatePath("/provider/onboarding");
}
