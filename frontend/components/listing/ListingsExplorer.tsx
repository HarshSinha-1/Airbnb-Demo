"use client";

import { CategoryStrip } from "@/components/listing/CategoryStrip";
import { FilterModal, type FilterValues } from "@/components/listing/FilterModal";
import { ListingGrid } from "@/components/listing/ListingGrid";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { api } from "@/lib/api";
import { PAGE_SIZE } from "@/lib/constants";
import { formatDateRange } from "@/lib/format";
import type { ListingCard, ListingFilters, PaginatedListings } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

export function ListingsExplorer({
  filters,
  heading,
  onCategoryChange,
  extraFilters,
  onExtraFilters,
}: {
  filters: ListingFilters;
  heading?: string;
  onCategoryChange?: (category?: string) => void;
  extraFilters: FilterValues;
  onExtraFilters: (next: FilterValues) => void;
}) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ListingCard[]>([]);
  const [meta, setMeta] = useState<Pick<PaginatedListings, "total" | "total_pages"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [nearby, setNearby] = useState<ListingCard[]>([]);

  // Serialize filter objects into stable strings so useCallback only resets
  // when the actual values change — not on every parent render that creates a new object.
  const filterKey = JSON.stringify(filters);
  const extraKey = JSON.stringify(extraFilters);

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const parsedFilters: ListingFilters = JSON.parse(filterKey) as ListingFilters;
        const parsedExtra: FilterValues = JSON.parse(extraKey) as FilterValues;
        const data = await api.getListings({
          ...parsedFilters,
          min_price: parsedExtra.min_price,
          max_price: parsedExtra.max_price,
          property_type: parsedExtra.property_type,
          amenities: parsedExtra.amenities.length ? parsedExtra.amenities : undefined,
          page: nextPage,
          page_size: PAGE_SIZE,
        });
        setMeta({ total: data.total, total_pages: data.total_pages });
        setItems((prev) => {
          if (!append) return data.items;
          // Deduplicate by id to guard against race conditions where an in-flight
          // append completes after a reset — React would warn about duplicate keys.
          const existingIds = new Set(prev.map((l) => l.id));
          const fresh = data.items.filter((l) => !existingIds.has(l.id));
          return [...prev, ...fresh];
        });
        setPage(nextPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load listings");
        if (!append) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filterKey, extraKey],
  );

  useEffect(() => {
    load(1, false).catch(() => {});
  }, [load]);

  useEffect(() => {
    if (loading || error || items.length > 0) {
      return;
    }
    api
      .getListings({ page: 1, page_size: 4 })
      .then((data) => setNearby(data.items))
      .catch(() => setNearby([]));
  }, [loading, error, items.length]);

  return (
    <div className="page-gutter pb-16">
      {onCategoryChange ? (
        <CategoryStrip
          value={filters.category}
          onChange={onCategoryChange}
          onOpenFilters={() => setFiltersOpen(true)}
        />
      ) : (
        <div className="flex justify-end py-4">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="h-12 rounded-xl border border-border-default px-4 font-semibold"
          >
            Filters
          </button>
        </div>
      )}

      {heading || filters.location ? (
        <h1 className="mb-6 mt-4 text-[22px] font-semibold">
          {meta
            ? `${meta.total} place${meta.total === 1 ? "" : "s"}${filters.location ? ` in ${filters.location}` : heading ? ` · ${heading}` : ""}`
            : (heading ?? (filters.location ? `Places in ${filters.location}` : "Search results"))}
        </h1>
      ) : null}

      {error ? <ErrorState message={error} onRetry={() => void load(1, false)} /> : null}

      {!error && !loading && items.length === 0 ? (
        <>
          <EmptyState
            title="No exact matches"
            body="Try changing your dates or removing some filters."
            action={
              <Button variant="secondary" onClick={() => onExtraFilters({ amenities: [] })}>
                Clear all filters
              </Button>
            }
          />
          {nearby.length ? (
            <div className="mt-4">
              <h2 className="mb-6 text-[22px] font-semibold">Explore nearby stays</h2>
              <ListingGrid listings={nearby} />
            </div>
          ) : null}
        </>
      ) : (
        <ListingGrid listings={items} loading={loading || loadingMore} subtitleFor={(l) => {
          const range = formatDateRange(filters.check_in, filters.check_out);
          return range ?? l.property_type.replaceAll("_", " ");
        }} />
      )}

      {meta && page < meta.total_pages ? (
        <div className="mt-12 flex justify-center">
          <Button variant="secondary" disabled={loadingMore} onClick={() => void load(page + 1, true)}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}

      <FilterModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={extraFilters}
        onApply={onExtraFilters}
        resultCount={meta?.total}
      />
    </div>
  );
}
