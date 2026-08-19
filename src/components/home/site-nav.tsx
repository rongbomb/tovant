import { getSession } from "@/lib/auth/get-session";
import { dashboardPathForRole } from "@/lib/auth/role-redirect";
import { getNavItemsForRole } from "@/lib/portal-nav";
import { getProviderLeadsCount, getProfileDisplay } from "@/lib/account-display";
import { BubbleNav } from "./bubble-nav";
import { DesktopThemeToggle } from "./theme-toggle";
import { LogoMark } from "./logo-mark";
import { AccountMenu } from "./account-menu";

const NAV_ITEMS = [
  { href: "#hero", label: "Home" },
  { href: "#near-you", label: "Find a Pro" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#for-providers", label: "For Providers" },
];

export async function SiteNav() {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "owner";

  const [display, leadsCount] = session
    ? await Promise.all([
        getProfileDisplay(session.user.id, session.user.name),
        role === "provider" ? getProviderLeadsCount(session.user.id) : Promise.resolve(0),
      ])
    : [null, 0];

  return (
    <div className="home-nav-wrap">
      <nav className="home-nav">
        <div className="home-nav-logo">
          <LogoMark />
          TOVANT
        </div>
        <BubbleNav items={NAV_ITEMS} variant="nav" />
        <div className="home-nav-actions">
          <DesktopThemeToggle />
          {session && display ? (
            <AccountMenu
              userId={session.user.id}
              displayName={display.displayName}
              hasAvatar={display.hasAvatar}
              dashboardHref={dashboardPathForRole(role)}
              navItems={getNavItemsForRole(role, leadsCount)}
            />
          ) : (
            <>
              <a className="home-btn home-btn-ghost" href="/login">Log in</a>
              <a className="home-btn home-btn-primary" href="/signup">Get Started</a>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
