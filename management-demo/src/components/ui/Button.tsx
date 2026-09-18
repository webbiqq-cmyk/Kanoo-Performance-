import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-race to-race-2 text-white shadow-[0_8px_24px_-8px_rgba(240,68,56,0.55)] hover:brightness-110 disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100",
  secondary:
    "bg-elevated text-ink border border-line-strong hover:border-ink-dim disabled:opacity-40",
  ghost: "bg-transparent text-ink-dim border border-line hover:text-ink hover:border-line-strong disabled:opacity-40",
  danger: "bg-race/15 text-race border border-race/40 hover:bg-race/25 disabled:opacity-40",
};

const SIZE: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5 rounded-md",
  md: "text-sm px-4 py-2.5 gap-2 rounded-lg",
  lg: "text-base px-5 py-3 gap-2 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "secondary", size = "md", className = "", disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={rest.type ?? "button"}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium tracking-wide transition disabled:cursor-not-allowed ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    />
  );
});
