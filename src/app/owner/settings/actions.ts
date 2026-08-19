"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";

export async function addVehicle(formData: FormData) {
  const session = await requireRole("owner");

  const year = Number(formData.get("year"));
  const make = String(formData.get("make") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const vin = String(formData.get("vin") ?? "").trim();
  const mileageRaw = formData.get("mileage");

  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
    throw new Error("Enter a valid model year.");
  }
  if (!make || !model) {
    throw new Error("Make and model are required.");
  }

  await db.insert(vehicles).values({
    ownerId: session.user.id,
    year,
    make,
    model,
    nickname: nickname || null,
    vin: vin || null,
    mileage: mileageRaw ? Number(mileageRaw) : null,
  });

  revalidatePath("/owner/settings");
}

export async function deleteVehicle(formData: FormData) {
  const session = await requireRole("owner");
  const vehicleId = String(formData.get("vehicleId") ?? "");
  if (!vehicleId) throw new Error("Missing vehicle id.");

  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId));
  if (!vehicle || vehicle.ownerId !== session.user.id) {
    throw new Error("Vehicle not found.");
  }

  await db.delete(vehicles).where(eq(vehicles.id, vehicleId));
  revalidatePath("/owner/settings");
}
