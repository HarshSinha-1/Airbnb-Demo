"use client";

import { ListingsExplorer } from "@/components/listing/ListingsExplorer";
import type { FilterValues } from "@/components/listing/FilterModal";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [extra, setExtra] = useState<FilterValues>(() => ({
    min_price: params.get("min_price") ? Number(params.get("min_price")) : undefined,
    max_price: params.get("max_price") ? Number(params.get("max_price")) : undefined,
    property_type: params.get("property_type") ?? undefined,
    amenities: (params.get("amenities") ?? "")
      .split(",")
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0),
  }));

  const filters = useMemo(
    () => ({
      location: params.get("location") ?? undefined,
      check_in: params.get("check_in") ?? undefined,
      check_out: params.get("check_out") ?? undefined,
      guests: params.get("guests") ? Number(params.get("guests")) : undefined,
      category: params.get("category") ?? undefined,
    }),
    [params],
  );

  const applyExtra = (next: FilterValues) => {
    setExtra(next);
    const q = new URLSearchParams(params.toString());
    if (next.min_price != null) q.set("min_price", String(next.min_price));
    else q.delete("min_price");
    if (next.max_price != null) q.set("max_price", String(next.max_price));
    else q.delete("max_price");
    if (next.property_type) q.set("property_type", next.property_type);
    else q.delete("property_type");
    if (next.amenities.length) q.set("amenities", next.amenities.join(","));
    else q.delete("amenities");
    router.replace(`/search?${q.toString()}`);
  };

  const onCategory = (category?: string) => {
    const q = new URLSearchParams(params.toString());
    if (category) q.set("category", category);
    else q.delete("category");
    router.replace(`/search?${q.toString()}`);
  };

  return (
    <ListingsExplorer
      filters={filters}
      heading="Search results"
      onCategoryChange={onCategory}
      extraFilters={extra}
      onExtraFilters={applyExtra}
    />
  );
}
