"use server";

import "server-only";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { requireRole } from "@/lib/auth/require-role";

// Banning/unbanning is neither a money-touching nor a verification-status
// action, so it skips writeAuditLog — the same documented exception already
// applied to gallery-photo moderation.
export async function banUserAction(formData: FormData) {
  await requireRole("admin");
  const userId = String(formData.get("userId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!userId) throw new Error("Missing user id.");

  await auth.api.banUser({
    headers: await headers(),
    body: { userId, banReason: reason || undefined },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function unbanUserAction(formData: FormData) {
  await requireRole("admin");
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Missing user id.");

  await auth.api.unbanUser({
    headers: await headers(),
    body: { userId },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}
