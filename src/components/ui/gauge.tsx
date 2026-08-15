/**
 * Instrument-cluster gauge — the one recurring rating/score visual in
 * Tovant (see CLAUDE.md "Design system"). Used anywhere a star rating
 * would normally appear; do not introduce star ratings elsewhere.
 *
 * Structural only for now — arc geometry and token-driven colors, no
 * finished visual polish until real design assets land.
 */

const RADIUS = 40;
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_FRACTION = 0.75; // 270° sweep, gauge-style rather than a full circle

export interface GaugeProps {
  /** 0-1 */
  value: number;
  label?: string;
  size?: number;
}

export function Gauge({ value, label, size = 120 }: GaugeProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const arcLength = CIRCUMFERENCE * ARC_FRACTION;
  const filled = arcLength * clamped;

  return (
    <div
      className="inline-flex flex-col items-center gap-1"
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="-rotate-[135deg]"
      >
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="var(--color-graphite)"
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={`${arcLength} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
        />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="var(--color-ignition)"
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
        />
      </svg>
      {label ? (
        <span className="font-mono text-sm text-steel">{label}</span>
      ) : null}
    </div>
  );
}
