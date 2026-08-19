import { requireRole } from "@/lib/auth/require-role";
import { PortalShell } from "@/components/dashboard/portal-shell";
import { ADMIN_NAV_ITEMS } from "@/lib/portal-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  return <PortalShell navItems={ADMIN_NAV_ITEMS}>{children}</PortalShell>;
}
