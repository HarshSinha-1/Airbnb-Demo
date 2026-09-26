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
          ? "border-text-primary bg-white text-text-primary"
          : "border-border-default bg-white text-text-primary hover:border-text-primary"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
