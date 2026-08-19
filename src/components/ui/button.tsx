import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: undefined;
  variant?: Variant;
};

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps | LinkButtonProps) {
  const classes = `home-btn home-btn-${variant} ${className}`.trim();

  if (props.href !== undefined) {
    const { href, ...rest } = props as LinkButtonProps;
    return <a href={href} className={classes} {...rest} />;
  }

  return <button type="button" className={classes} {...(props as ButtonProps)} />;
}
