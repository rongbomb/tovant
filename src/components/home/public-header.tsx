import Link from "next/link";
import { getSession } from "@/lib/auth/get-session";
import { dashboardPathForRole } from "@/lib/auth/role-redirect";
import { getNavItemsForRole } from "@/lib/portal-nav";
import { getProviderLeadsCount, getProfileDisplay } from "@/lib/account-display";
import { BubbleNav } from "./bubble-nav";
import { DesktopThemeToggle } from "./theme-toggle";
import { LogoMark } from "./logo-mark";
import { AccountMenu } from "./account-menu";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Find a Pro" },
  { href: "/become-a-provider", label: "For Providers" },
];

/**
 * Same nav bar as the homepage's `SiteNav`, for every other public route
 * (`/discover`, `/providers/[id]`, `/become-a-provider`) — the only
 * difference is `BubbleNav`'s `mode="route"` (real navigation) instead of
 * `"scroll"` (in-page anchors), since these pages don't have the
 * homepage's `#hero`/`#near-you`/etc. sections to scroll to.
 */
export async function PublicHeader() {
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
        <Link href="/" className="home-nav-logo">
          <LogoMark />
          TOVANT
        </Link>
        <BubbleNav items={NAV_ITEMS} variant="nav" mode="route" />
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
