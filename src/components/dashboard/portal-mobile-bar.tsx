"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/home/logo-mark";
import { DesktopThemeToggle } from "@/components/home/theme-toggle";
import { authClient } from "@/lib/auth/auth-client";

export function PortalMobileBar() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="portal-mobile-bar">
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LogoMark />
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <DesktopThemeToggle />
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          className="home-theme-toggle"
          style={{ border: "1px solid var(--home-line)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </div>
  );
}
