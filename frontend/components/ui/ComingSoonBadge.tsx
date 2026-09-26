"use client";

import { ReactNode } from "react";

export function ComingSoonBadge({
  icon,
  label,
  description,
  className = "",
}: {
  icon?: ReactNode;
  label: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-border-default bg-surface-soft p-6 motion-safe:animate-fade-rise ${className}`}
    >
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {icon && (
          <div className="mb-4 text-text-secondary motion-safe:animate-pulse-slow">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-text-primary">{label}</h3>
        {description && (
          <p className="mt-2 max-w-[280px] text-sm text-text-secondary">
            {description}
          </p>
        )}
        <div className="mt-4 inline-block rounded-full border border-border-strong bg-surface-raised px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Coming Soon
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-0 bg-[linear-gradient(90deg,transparent,var(--border-strong),transparent)] bg-[length:200%_100%] motion-safe:animate-shimmer opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
    </div>
  );
}
