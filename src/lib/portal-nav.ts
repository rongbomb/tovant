import type { PortalNavItem } from "@/components/dashboard/portal-sidebar";

/**
 * Single source of truth for each portal's nav items — shared by
 * `PortalSidebar` (the full dashboard nav) and `AccountMenu` (the
 * hover dropdown under the profile chip elsewhere on the site), so the
 * two can never drift out of sync.
 */
export const OWNER_NAV_ITEMS: PortalNavItem[] = [
  { href: "/owner/dashboard", label: "Dashboard", icon: "M4 4h16v16H4z M4 9h16M9 4v5" },
  { href: "/discover", label: "Find a pro", icon: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3" },
  { href: "/owner/jobs", label: "Jobs", icon: "M9 12l2 2 4-4 M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" },
  { href: "/owner/messages", label: "Messages", icon: "M4 5h16v11H8l-4 4V5z" },
  { href: "/owner/settings", label: "Settings", icon: "M12 8a3.5 3.5 0 100-7 3.5 3.5 0 000 7z M5 20c1.5-4 5-6 7-6s5.5 2 7 6" },
];

export const ADMIN_NAV_ITEMS: PortalNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "M4 4h16v16H4z M4 9h16M9 4v5" },
  { href: "/admin/providers", label: "Verification", icon: "M9 12l2 2 4-4 M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" },
  { href: "/admin/users", label: "Users", icon: "M12 8a3.5 3.5 0 100-7 3.5 3.5 0 000 7z M5 20c1.5-4 5-6 7-6s5.5 2 7 6" },
  { href: "/admin/disputes", label: "Disputes", icon: "M12 9v4 M12 17h.01 M10.3 3.9L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" },
  { href: "/admin/gallery", label: "Gallery", icon: "M4 5h16v14H4z M4 15l4-4 4 4 4-6 4 6" },
  { href: "/admin/settings", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6z M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 3h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L10 21h4l.5-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" },
  { href: "/admin/audit-log", label: "Audit log", icon: "M4 5h16v11H8l-4 4V5z" },
];

export function getProviderNavItems(leadsCount = 0): PortalNavItem[] {
  return [
    { href: "/provider/dashboard", label: "Leads", icon: "M4 4h16v16H4z M4 9h16M9 4v5", badge: leadsCount || undefined },
    { href: "/provider/calendar", label: "Calendar", icon: "M3 5h18v16H3z M3 10h18M8 3v4M16 3v4" },
    { href: "/provider/jobs", label: "Jobs", icon: "M9 12l2 2 4-4 M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" },
    { href: "/provider/earnings", label: "Earnings", icon: "M12 2v20 M17 5.5c-1.2-1-3-1.5-5-1.5-3.3 0-6 1.6-6 4s2.7 4 6 4 6 1.6 6 4-2.7 4-6 4c-2 0-3.8-.5-5-1.5" },
    { href: "/provider/reviews", label: "Reviews", icon: "M20 15a2 2 0 01-2 2H8l-4 4V5a2 2 0 012-2h12a2 2 0 012 2z M7 9h10M7 12h6" },
    { href: "/provider/settings", label: "Profile", icon: "M12 8a3.5 3.5 0 100-7 3.5 3.5 0 000 7z M5 20c1.5-4 5-6 7-6s5.5 2 7 6" },
    { href: "/provider/messages", label: "Messages", icon: "M4 5h16v11H8l-4 4V5z" },
  ];
}

export function getNavItemsForRole(role: string, leadsCount = 0): PortalNavItem[] {
  switch (role) {
    case "provider":
      return getProviderNavItems(leadsCount);
    case "admin":
      return ADMIN_NAV_ITEMS;
    case "owner":
    default:
      return OWNER_NAV_ITEMS;
  }
}
