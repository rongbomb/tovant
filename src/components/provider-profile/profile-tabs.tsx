"use client";

import { useState, type ReactNode } from "react";

const TABS = ["Overview", "Services", "Reviews", "Certifications"] as const;
type Tab = (typeof TABS)[number];

export function ProfileTabs({ panels }: { panels: Record<Tab, ReactNode> }) {
  const [active, setActive] = useState<Tab>("Overview");

  return (
    <div>
      <div className="mb-8 flex gap-7" style={{ borderBottom: "1px solid var(--home-line)" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className="pb-3 text-sm transition-colors"
            style={{
              borderBottom: `2px solid ${active === tab ? "var(--home-accent)" : "transparent"}`,
              color: active === tab ? "var(--home-text)" : "var(--home-text-muted)",
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      {panels[active]}
    </div>
  );
}
