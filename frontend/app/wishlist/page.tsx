"use client";

import { ListingGrid } from "@/components/listing/ListingGrid";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { HeartIcon } from "@/components/ui/Icons";
import { useCurrentUser } from "@/context/UserContext";
import { useWishlist } from "@/context/WishlistContext";
import { api } from "@/lib/api";
import type { ListingCard } from "@/lib/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function WishlistPage() {
  const { currentUser } = useCurrentUser();
  const { savedIds, loading: wishLoading } = useWishlist();
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentUser) {
      setListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await api.getWishlist();
      setListings(items.map((item) => item.listing));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load wishlists");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void load();
  }, [load, savedIds]);

  return (
    <div className="page-gutter pb-24 pt-10">
      <h1 className="text-[32px] font-semibold leading-[38px]">Wishlists</h1>
      <p className="mt-2 text-[22px] font-semibold">
        {listings.length} saved home{listings.length === 1 ? "" : "s"}
      </p>

      {!currentUser ? (
        <EmptyState
          icon={<HeartIcon />}
          title="Choose a mock user"
          body="Wishlist hearts sync to the selected guest via X-User-Id."
        />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : !loading && listings.length === 0 ? (
        <EmptyState
          icon={<HeartIcon />}
          title="Create your first wishlist"
          body="As you search, tap the heart icon to save your favourite places."
          action={
            <Link href="/">
              <Button>Explore homes</Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-10">
          <ListingGrid listings={listings} loading={loading || wishLoading} />
        </div>
      )}
    </div>
  );
}
