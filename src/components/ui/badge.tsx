import type { HTMLAttributes } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

export function Badge({
  tone = "neutral",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={`home-badge home-badge-${tone} ${className}`.trim()} {...props} />;
}
