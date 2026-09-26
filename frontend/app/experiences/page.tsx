"use client";

import { ListingGrid } from "@/components/listing/ListingGrid";
import { ErrorState } from "@/components/ui/ErrorState";
import { api } from "@/lib/api";
import type { ListingCard } from "@/lib/types";
import { useEffect, useState } from "react";

export default function ExperiencesPage() {
  const [items, setItems] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getListings({ page: 1, page_size: 12 })
      .then((data) => setItems(data.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load experiences"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-gutter pb-24 pt-10">
      <h1 className="text-[32px] font-semibold leading-[38px]">Experiences</h1>
      <p className="mt-3 max-w-2xl text-text-secondary">
        The live API currently publishes homes. Browse hosted stays from the same catalog while Experiences
        endpoints are not available.
      </p>
      {error ? <ErrorState message={error} /> : <div className="mt-10"><ListingGrid listings={items} loading={loading} /></div>}
    </div>
  );
}
