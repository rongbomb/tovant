import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="home-field-label">{children}</span>;
}

// suppressHydrationWarning on all three: browser password managers/autofill
// (Chrome, 1Password, etc.) inject style/icon attributes onto form fields
// before React hydrates — a real, unavoidable mismatch class with nothing
// to do with app code (same reasoning as SiteFooter's newsletter input).
// Placed before `...props` so a caller can still override it explicitly.

export function Input({
  label,
  className = "",
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const input = (
    <input id={id} className={`home-input ${className}`.trim()} suppressHydrationWarning {...props} />
  );
  if (!label) return input;
  return (
    <label htmlFor={id}>
      <FieldLabel>{label}</FieldLabel>
      {input}
    </label>
  );
}

export function Textarea({
  label,
  className = "",
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const textarea = (
    <textarea id={id} className={`home-textarea ${className}`.trim()} suppressHydrationWarning {...props} />
  );
  if (!label) return textarea;
  return (
    <label htmlFor={id}>
      <FieldLabel>{label}</FieldLabel>
      {textarea}
    </label>
  );
}

export function Select({
  label,
  className = "",
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const select = (
    <select id={id} className={`home-select ${className}`.trim()} suppressHydrationWarning {...props}>
      {children}
    </select>
  );
  if (!label) return select;
  return (
    <label htmlFor={id}>
      <FieldLabel>{label}</FieldLabel>
      {select}
    </label>
  );
}
