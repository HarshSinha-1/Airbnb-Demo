"use client";

import { formatRating } from "@/lib/format";
import { formatPrice } from "@/lib/formatPrice";
import type { HostListingCard } from "@/lib/types";
import Link from "next/link";

export function HostListingTable({
  listings,
  onDelete,
}: {
  listings: HostListingCard[];
  onDelete: (id: number) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-border-soft py-3 text-sm text-text-secondary">
        <div>Property</div>
        <div>Status</div>
        <div>Bookings</div>
        <div>Nightly price</div>
        <div>Actions</div>
      </div>
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="grid h-20 grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-border-soft"
        >
          <div className="flex items-center gap-3">
            {listing.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.cover_image} alt="" className="h-12 w-16 rounded object-cover" />
            ) : (
              <div className="h-12 w-16 rounded bg-surface-raised" />
            )}
            <div className="min-w-0">
              <div className="truncate font-semibold">{listing.title}</div>
              <div className="text-sm text-text-secondary">
                {listing.city}, {listing.country}
              </div>
            </div>
          </div>
          <div>Listed</div>
          <div>{listing.booking_count}</div>
          <div>{formatPrice(listing.price_per_night, listing.currency)}</div>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <Link href={`/host/listings/${listing.id}/edit`} className="underline">
              Edit
            </Link>
            <button type="button" className="text-error" onClick={() => onDelete(listing.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
