"use client";

import { ListingsExplorer } from "@/components/listing/ListingsExplorer";
import type { FilterValues } from "@/components/listing/FilterModal";
import { useMemo, useState } from "react";

export default function HomePage() {
  const [category, setCategory] = useState<string | undefined>();
  const [extra, setExtra] = useState<FilterValues>({ amenities: [] });

  // Memoize so ListingsExplorer gets a stable reference — prevents the load
  // useCallback from resetting on every parent render and causing duplicate-key
  // React warnings when an in-flight "load more" append races with a reset.
  const filters = useMemo(() => ({ category }), [category]);

  return (
    <ListingsExplorer
      filters={filters}
      onCategoryChange={setCategory}
      extraFilters={extra}
      onExtraFilters={setExtra}
    />
  );
}
