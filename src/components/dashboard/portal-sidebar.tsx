"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoMark } from "@/components/home/logo-mark";
import { DesktopThemeToggle } from "@/components/home/theme-toggle";
import { authClient } from "@/lib/auth/auth-client";

export interface PortalNavItem {
  href: string;
  label: string;
  /** SVG path `d` attribute(s), matching the icon style used across the app. */
  icon: string;
  badge?: number;
}

export function PortalSidebar({ navItems }: { navItems: PortalNavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="portal-sidebar">
      <Link href="/" className="portal-sidebar-logo">
        <LogoMark />
        TOVANT
      </Link>
      <nav className="portal-sidebar-nav">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`portal-nav-link${active ? " is-active" : ""}`}
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <path d={item.icon} />
              </svg>
              {item.label}
              {item.badge ? <span className="portal-nav-badge">{item.badge}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="portal-sidebar-foot" style={{ flexDirection: "column", alignItems: "stretch", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/" className="portal-nav-link" style={{ padding: "8px 4px", flex: 1 }}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <path d="M4 11l8-7 8 7M6 10v9h12v-9" />
            </svg>
            Back to Tovant
          </Link>
          <DesktopThemeToggle />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="portal-nav-link"
          style={{ padding: "8px 4px", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
}
