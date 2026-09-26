export function Pill({
  active,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={`h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-150 ${
        active
          ? "border-text-primary bg-surface-raised text-text-primary font-semibold"
          : "border-border-default bg-surface-raised text-text-primary hover:border-text-primary"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
