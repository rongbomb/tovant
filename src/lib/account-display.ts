import "server-only";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { profiles, quotes } from "@/db/schema";

export interface ProfileDisplay {
  displayName: string;
  hasAvatar: boolean;
}

/** Shared by every nav bar that shows an account chip (SiteNav, PublicHeader). */
export async function getProfileDisplay(userId: string, fallbackName: string): Promise<ProfileDisplay> {
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
  return {
    displayName: profile?.displayName || fallbackName,
    hasAvatar: Boolean(profile?.avatarObjectKey),
  };
}

/** Same "new leads" badge count PortalSidebar shows, for the nav dropdown's Leads item. */
export async function getProviderLeadsCount(providerUserId: string): Promise<number> {
  const rows = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.providerUserId, providerUserId), eq(quotes.status, "requested")));
  return rows.length;
}
