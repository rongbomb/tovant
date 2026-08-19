"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface BubbleNavItem {
  /** A `#section-id` in "scroll" mode, or a route path in "route" mode. */
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface BubbleNavProps {
  items: BubbleNavItem[];
  variant: "nav" | "tab";
  /**
   * "scroll" (default) smooth-scrolls to an in-page anchor, tracking the
   * active pill via click state — the homepage's original behavior.
   * "route" navigates between real pages via next/link, deriving the
   * active pill from the current pathname instead — used by portal nav.
   */
  mode?: "scroll" | "route";
}

export function BubbleNav({ items, variant, mode = "scroll" }: BubbleNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [clickedIndex, setClickedIndex] = useState(0);
  const pathname = usePathname();

  const activeIndex =
    mode === "route"
      ? Math.max(
          0,
          items.findIndex(
            (item) => pathname === item.href || pathname?.startsWith(`${item.href}/`),
          ),
        )
      : clickedIndex;

  function moveTo(el: HTMLElement) {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    bubble.style.width = `${el.offsetWidth}px`;
    bubble.style.transform = `translateX(${el.offsetLeft}px)`;
  }

  useEffect(() => {
    const active = itemRefs.current[activeIndex];
    if (active) requestAnimationFrame(() => moveTo(active));

    function onResize() {
      const cur = itemRefs.current[activeIndex];
      if (cur) moveTo(cur);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex]);

  function handleScrollClick(e: React.MouseEvent, index: number, targetId: string) {
    e.preventDefault();
    setClickedIndex(index);
    const target = document.querySelector(targetId);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const linkClass = variant === "nav" ? "home-nav-link" : "home-tab-link";
  const bubbleClass = variant === "nav" ? "home-nav-bubble" : "home-tab-bubble";
  const wrapClass = variant === "nav" ? "home-nav-links" : "home-tab-bar-inner";

  return (
    <div className={wrapClass} ref={containerRef}>
      <div className={bubbleClass} ref={bubbleRef} />
      {items.map((item, index) =>
        mode === "route" ? (
          <Link
            key={item.href}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={`${linkClass}${index === activeIndex ? " is-active" : ""}`}
            href={item.href}
          >
            {item.icon}
            {variant === "tab" ? <span>{item.label}</span> : item.label}
          </Link>
        ) : (
          <a
            key={item.href}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={`${linkClass}${index === activeIndex ? " is-active" : ""}`}
            href={item.href}
            onClick={(e) => handleScrollClick(e, index, item.href)}
          >
            {item.icon}
            {variant === "tab" ? <span>{item.label}</span> : item.label}
          </a>
        ),
      )}
    </div>
  );
}
