import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "black" | "danger" | "underline";

const styles: Record<Variant, string> = {
  primary:
    "bg-rausch text-white hover:bg-rausch-hover active:bg-rausch-active disabled:bg-rausch-disabled",
  secondary:
    "bg-surface-raised text-text-primary border border-text-primary hover:bg-surface-soft",
  ghost:
    "bg-surface-raised text-text-primary border border-border-default hover:border-text-primary",
  black: "bg-text-primary text-bg hover:opacity-90",
  danger: "bg-error text-white hover:opacity-90",
  underline:
    "bg-transparent text-text-primary underline underline-offset-4 font-semibold hover:text-text-body",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex h-12 items-center justify-center rounded-lg px-6 text-base font-semibold transition-colors duration-150 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
