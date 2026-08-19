/**
 * Read-only 5-segment rating display, used on individual reviews. A
 * deliberately different shape than Gauge (reserved for the single
 * aggregate ring score) — segments, never stars, per CLAUDE.md.
 */
export function RatingBars({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex gap-1" role="img" aria-label={`${filled} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className="h-1.5 w-4 rounded-sm"
          style={{ background: i < filled ? "var(--home-accent)" : "var(--home-line)" }}
        />
      ))}
    </div>
  );
}
