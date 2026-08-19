"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import type { PortalNavItem } from "@/components/dashboard/portal-sidebar";

/**
 * The profile chip shown in nav bars across the (non-portal-dashboard) site
 * — hovering it reveals the same quick links as the user's dashboard
 * sidebar (`src/lib/portal-nav.ts`, the single source of truth both pull
 * from), so switching between browsing and managing an account never
 * requires a full page trip through the dashboard just to navigate.
 */
export function AccountMenu({
  userId,
  displayName,
  hasAvatar,
  dashboardHref,
  navItems,
}: {
  userId: string;
  displayName: string;
  hasAvatar: boolean;
  dashboardHref: string;
  navItems: PortalNavItem[];
}) {
  const router = useRouter();
  const firstName = displayName.split(" ")[0] || "Account";

  async function handleLogout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="home-account-menu">
      <Link href={dashboardHref} className="home-account-trigger">
        <span className="home-account-avatar">
          {hasAvatar ? (
            <Image
              src={`/api/avatars/${userId}/image`}
              alt={displayName}
              fill
              sizes="28px"
              className="object-cover"
              unoptimized
            />
          ) : (
            firstName[0]?.toUpperCase()
          )}
        </span>
        <span className="home-account-name">{firstName}</span>
      </Link>
      <div className="home-account-dropdown">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="home-account-link">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <path d={item.icon} />
            </svg>
            {item.label}
          </Link>
        ))}
        <div className="home-account-divider" />
        <button type="button" onClick={handleLogout} className="home-account-link home-account-logout">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Log out
        </button>
      </div>
    </div>
  );
}
