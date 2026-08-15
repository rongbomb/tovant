import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { dashboardPathForRole, type UserRole } from "./role-redirect";

/**
 * Authoritative access check for a role-gated route group layout.
 * middleware.ts only checks cookie presence (edge-safe, no DB hit); this
 * is the real check — session validity, mandatory 2FA, and role match —
 * and runs on the Node runtime since it needs Drizzle/pg.
 */
export async function requireRole(expectedRole: UserRole) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const user = session.user as typeof session.user & {
    role?: string;
    twoFactorEnabled?: boolean | null;
  };

  if (!user.twoFactorEnabled) {
    redirect("/verify-2fa/setup");
  }

  if (user.role !== expectedRole) {
    // No admin impersonation of owner/provider views in v1 — send them to
    // their own dashboard rather than granting silent cross-role access.
    redirect(dashboardPathForRole(user.role ?? "owner"));
  }

  return session;
}
