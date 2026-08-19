import type { ElementType, HTMLAttributes } from "react";

export function Card({
  as: Tag = "div",
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & { as?: ElementType }) {
  return <Tag className={`home-card ${className}`.trim()} {...props} />;
}
