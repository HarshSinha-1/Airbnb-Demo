"use client";

import { CategoryGlyph, FiltersIcon } from "@/components/ui/Icons";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";
import { useEffect, useState } from "react";

export function CategoryStrip({
  value,
  onChange,
  onOpenFilters,
}: {
  value?: string;
  onChange: (id?: string) => void;
  onOpenFilters?: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load categories"));
  }, []);

  if (error) {
    return <p className="py-4 text-sm text-error">{error}</p>;
  }

  return (
    <div className="flex h-[90px] items-end gap-6">
      <div className="no-scrollbar flex min-w-0 flex-1 gap-8 overflow-x-auto">
        {categories.map((cat) => {
          const active = value === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(active ? undefined : cat.id)}
              className={`flex w-[80px] shrink-0 flex-col items-center gap-2 pb-3 text-[12px] ${
                active
                  ? "border-b-2 border-text-primary font-semibold text-text-primary"
                  : "border-b-2 border-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
              }`}
            >
              <CategoryGlyph icon={cat.icon} />
              <span className="truncate">{cat.name}</span>
            </button>
          );
        })}
      </div>
      {onOpenFilters ? (
        <button
          type="button"
          onClick={onOpenFilters}
          className="mb-3 flex h-12 w-[92px] shrink-0 items-center justify-center gap-2 rounded-xl border border-border-default text-sm font-semibold hover:border-text-primary"
        >
          <FiltersIcon /> Filters
        </button>
      ) : null}
    </div>
  );
}
