import { BubbleNav, type BubbleNavItem } from "@/components/home/bubble-nav";

export function PortalMobileNav({ items }: { items: BubbleNavItem[] }) {
  return (
    <div className="home-tab-bar">
      <BubbleNav items={items} variant="tab" mode="route" />
    </div>
  );
}
