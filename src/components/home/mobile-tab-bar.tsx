import { BubbleNav, type BubbleNavItem } from "./bubble-nav";

const TAB_ITEMS: BubbleNavItem[] = [
  {
    href: "#hero",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 11l8-7 8 7M6 10v9h12v-9" />
      </svg>
    ),
  },
  {
    href: "#near-you",
    label: "Find",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    ),
  },
  {
    href: "#how-it-works",
    label: "Guide",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v.01M11 12h1v5h1" />
      </svg>
    ),
  },
  {
    href: "#for-providers",
    label: "Pros",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
    ),
  },
];

export function MobileTabBar() {
  return (
    <div className="home-tab-bar">
      <BubbleNav items={TAB_ITEMS} variant="tab" />
    </div>
  );
}
