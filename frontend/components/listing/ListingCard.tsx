"use client";

import { StarIcon } from "@/components/ui/Icons";
import { WishlistButton } from "@/components/listing/WishlistButton";
import { formatRating, isGuestFavourite } from "@/lib/format";
import { formatPrice } from "@/lib/formatPrice";
import type { ListingCard as ListingCardType } from "@/lib/types";
import Link from "next/link";

export function ListingCard({
  listing,
  subtitle,
}: {
  listing: ListingCardType;
  subtitle?: string;
}) {
  const favourite = isGuestFavourite(listing.average_rating, listing.review_count);
  const rating = formatRating(listing.average_rating);

  return (
    <Link href={`/listing/${listing.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-[14px]">
        {listing.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.cover_image}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-200 group-hover:brightness-[0.97]"
          />
        ) : (
          <div className="h-full w-full bg-surface-raised" />
        )}
        {favourite ? (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-float">
            Guest favourite
          </span>
        ) : null}
        <WishlistButton listingId={listing.id} className="absolute right-3 top-3" />
      </div>
      <div className="mt-3">
        <div className="flex items-start justify-between gap-2 text-[15px] font-semibold leading-5">
          <span className="truncate">
            {listing.city}, {listing.country}
          </span>
          {rating ? (
            <span className="flex shrink-0 items-center gap-1 font-medium">
              <StarIcon /> {rating}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[15px] leading-5 text-text-secondary">{listing.title}</p>
        <p className="mt-0.5 truncate text-[15px] leading-5 text-text-secondary">
          {subtitle ?? listing.property_type.replaceAll("_", " ")}
        </p>
        <p className="mt-1 text-[15px] leading-5">
          <span className="font-semibold">{formatPrice(listing.price_per_night, listing.currency)}</span>
          <span className="font-normal"> night</span>
        </p>
      </div>
    </Link>
  );
}
