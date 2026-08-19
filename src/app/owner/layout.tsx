import { requireRole } from "@/lib/auth/require-role";
import { PortalShell } from "@/components/dashboard/portal-shell";
import { OWNER_NAV_ITEMS } from "@/lib/portal-nav";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  await requireRole("owner");
  return <PortalShell navItems={OWNER_NAV_ITEMS}>{children}</PortalShell>;
}
