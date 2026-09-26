"use client";

import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StarIcon } from "@/components/ui/Icons";
import { formatDateRange, formatRating } from "@/lib/format";
import type { ListingDetail, PriceQuote } from "@/lib/types";

export function ConfirmTripModal({
  open,
  onClose,
  listing,
  checkIn,
  checkOut,
  guests,
  quote,
  onContinue,
}: {
  open: boolean;
  onClose: () => void;
  listing: ListingDetail;
  checkIn: string;
  checkOut: string;
  guests: number;
  quote: PriceQuote;
  onContinue: () => void;
}) {
  const rating = formatRating(listing.review_summary.average_rating);
  const cover = listing.images.slice().sort((a, b) => a.position - b.position)[0];

  return (
    <Modal open={open} onClose={onClose} title="Confirm your trip" width="max-w-[560px]">
      <div className="flex gap-4">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" className="h-[90px] w-[120px] rounded-lg object-cover" />
        ) : (
          <div className="h-[90px] w-[120px] rounded-lg bg-surface-raised" />
        )}
        <div>
          <p className="font-semibold">{listing.title}</p>
          <p className="text-sm text-text-secondary">
            {listing.city}, {listing.country}
          </p>
          {rating ? (
            <p className="mt-1 flex items-center gap-1 text-sm">
              <StarIcon /> {rating} · {listing.review_summary.review_count} reviews
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex items-start justify-between border-t border-border-soft pt-6">
        <div>
          <p className="font-semibold">Dates</p>
          <p className="mt-1 text-text-secondary">{formatDateRange(checkIn, checkOut)}</p>
        </div>
        <button type="button" className="font-semibold underline" onClick={onClose}>
          Edit
        </button>
      </div>
      <div className="mt-6 flex items-start justify-between">
        <div>
          <p className="font-semibold">Guests</p>
          <p className="mt-1 text-text-secondary">
            {guests} guest{guests === 1 ? "" : "s"}
          </p>
        </div>
        <button type="button" className="font-semibold underline" onClick={onClose}>
          Edit
        </button>
      </div>

      <PriceBreakdown quote={quote} />

      <Button className="mt-8 w-full" onClick={onContinue}>
        Continue
      </Button>
    </Modal>
  );
}
