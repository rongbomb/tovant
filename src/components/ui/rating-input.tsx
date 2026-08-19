"use client";

import { useState } from "react";

/**
 * Clickable counterpart to RatingBars for the review submit/edit form.
 * Renders a real radio group (accessible, works without JS) with the
 * bar visualization layered on top for hover/selection feedback.
 */
export function RatingInput({ name, defaultValue = 0 }: { name: string; defaultValue?: number }) {
  const [value, setValue] = useState(defaultValue);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1" onMouseLeave={() => setHovered(null)}>
        {Array.from({ length: 5 }, (_, i) => {
          const n = i + 1;
          const active = (hovered ?? value) >= n;
          return (
            <label key={n} onMouseEnter={() => setHovered(n)}>
              <input
                type="radio"
                name={name}
                value={n}
                checked={value === n}
                onChange={() => setValue(n)}
                className="sr-only"
              />
              <span
                className="block h-3 w-6 cursor-pointer rounded-sm transition-colors"
                style={{ background: active ? "var(--home-accent)" : "var(--home-line)" }}
              />
            </label>
          );
        })}
      </div>
      <span className="text-sm" style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}>
        {value || "—"} / 5
      </span>
    </div>
  );
}
