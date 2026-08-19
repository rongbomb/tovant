/**
 * Instrument-cluster gauge — the one recurring rating/score visual in
 * Tovant (see CLAUDE.md "Design system"). Used anywhere a star rating
 * would normally appear; do not introduce star ratings elsewhere.
 *
 * Structural only for now — arc geometry and token-driven colors, no
 * finished visual polish until real design assets land.
 */

const RADIUS = 40;
const STROKE_WIDTH = 12.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_FRACTION = 0.75; // 270° sweep, gauge-style rather than a full circle

export interface GaugeProps {
  /** 0-1 */
  value: number;
  label?: string;
  /** Short value shown centered inside the ring itself (e.g. "4.8", "85%"). */
  centerValue?: string;
  size?: number;
  trackColor?: string;
  fillColor?: string;
}

export function Gauge({
  value,
  label,
  centerValue,
  size = 120,
  trackColor = "var(--home-tint-line)",
  fillColor = "var(--home-accent)",
}: GaugeProps) {
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
      <div className="relative" style={{ width: size, height: size }}>
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
            stroke={trackColor}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${arcLength} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke={fillColor}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
          />
        </svg>
        {centerValue ? (
          <span
            className="absolute inset-0 flex items-center justify-center text-xs font-bold"
            style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text)" }}
          >
            {centerValue}
          </span>
        ) : null}
      </div>
      {label ? (
        <span className="text-sm" style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}>
          {label}
        </span>
      ) : null}
    </div>
  );
}
