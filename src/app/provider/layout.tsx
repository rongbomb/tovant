import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { providerProfiles, quotes } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import { PortalShell } from "@/components/dashboard/portal-shell";
import { getProviderNavItems } from "@/lib/portal-nav";

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("provider");

  const provider = await db.query.providerProfiles.findFirst({
    where: eq(providerProfiles.userId, session.user.id),
  });
  const leadsCount = provider
    ? (
        await db
          .select()
          .from(quotes)
          .where(and(eq(quotes.providerUserId, session.user.id), eq(quotes.status, "requested")))
      ).length
    : 0;

  return <PortalShell navItems={getProviderNavItems(leadsCount)}>{children}</PortalShell>;
}
