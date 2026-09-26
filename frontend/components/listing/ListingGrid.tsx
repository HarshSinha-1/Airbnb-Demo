import { ListingCard } from "@/components/listing/ListingCard";
import { ListingCardSkeleton } from "@/components/ui/Skeleton";
import type { ListingCard as ListingCardType } from "@/lib/types";

export function ListingGrid({
  listings,
  loading,
  subtitleFor,
}: {
  listings: ListingCardType[];
  loading?: boolean;
  subtitleFor?: (listing: ListingCardType) => string;
}) {
  if (loading && listings.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-x-6 gap-y-10 min-[1128px]:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-x-6 gap-y-10 min-[1128px]:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} subtitle={subtitleFor?.(listing)} />
      ))}
      {loading
        ? Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={`s-${i}`} />)
        : null}
    </div>
  );
}
