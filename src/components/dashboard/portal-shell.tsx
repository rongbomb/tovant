import type { ReactNode } from "react";
import { PortalSidebar, type PortalNavItem } from "./portal-sidebar";
import { PortalMobileNav } from "./portal-mobile-nav";
import { PortalMobileBar } from "./portal-mobile-bar";

/**
 * Shared chrome for every dashboard portal (owner/provider/admin) — sidebar
 * on desktop, bottom tab bar on mobile, both driven by the same nav item
 * list so they never drift. Wraps content in `.home-page` so this portal's
 * routes opt into the app-wide sage-green design system (see home.css's
 * header comment) without affecting any not-yet-migrated route.
 */
export function PortalShell({
  navItems,
  children,
}: {
  navItems: PortalNavItem[];
  children: ReactNode;
}) {
  return (
    <div className="home-page portal-shell">
      <PortalSidebar navItems={navItems} />
      <div className="portal-main">
        <PortalMobileBar />
        {children}
      </div>
      <PortalMobileNav
        items={navItems.slice(0, 5).map((item) => ({
          href: item.href,
          label: item.label,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={item.icon} />
            </svg>
          ),
        }))}
      />
    </div>
  );
}
