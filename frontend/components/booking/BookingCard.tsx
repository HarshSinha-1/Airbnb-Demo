"use client";

import { DateRangePicker } from "@/components/booking/DateRangePicker";
import { GuestPicker } from "@/components/booking/GuestPicker";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { Button } from "@/components/ui/Button";
import { StarIcon } from "@/components/ui/Icons";
import { formatDateRange, formatRating } from "@/lib/format";
import { formatPrice } from "@/lib/formatPrice";
import type { AvailabilityRange, ListingDetail, PriceQuote } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

export function BookingCard({
  listing,
  checkIn,
  checkOut,
  guests,
  adults,
  childrenCount,
  quote,
  quoteLoading,
  quoteError,
  blocked,
  bookingError,
  submitting,
  onDatesChange,
  onGuestsChange,
  onReserve,
}: {
  listing: ListingDetail;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  adults: number;
  childrenCount: number;
  quote: PriceQuote | null;
  quoteLoading: boolean;
  quoteError: string | null;
  blocked: AvailabilityRange[];
  bookingError: string | null;
  submitting: boolean;
  onDatesChange: (checkIn?: string, checkOut?: string) => void;
  onGuestsChange: (adults: number, children: number) => void;
  onReserve: () => void;
}) {
  const [open, setOpen] = useState<"dates" | "guests" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const rating = formatRating(listing.review_summary.average_rating);

  return (
    <aside className="sticky top-[120px] w-full md:w-[372px] shrink-0 rounded-xl border border-border-default bg-white p-6 shadow-lift">
      <div className="mb-6 flex items-end justify-between">
        <p className="text-[22px] font-semibold">
          {formatPrice(listing.price_per_night, listing.currency)}{" "}
          <span className="text-base font-normal">night</span>
        </p>
        {rating ? (
          <p className="flex items-center gap-1 text-sm">
            <StarIcon /> {rating} · {listing.review_summary.review_count} reviews
          </p>
        ) : null}
      </div>

      <div ref={ref} className="relative rounded-lg border border-border-strong">
        <div className="grid grid-cols-2 border-b border-border-strong">
          <button
            type="button"
            className="px-3 py-3 text-left"
            onClick={() => setOpen(open === "dates" ? null : "dates")}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide">Check-in</div>
            <div className="text-sm">{checkIn ? formatDateRange(checkIn, checkIn)?.split("–")[0] : "Add date"}</div>
          </button>
          <button
            type="button"
            className="border-l border-border-strong px-3 py-3 text-left"
            onClick={() => setOpen(open === "dates" ? null : "dates")}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide">Checkout</div>
            <div className="text-sm">{checkOut ? formatDateRange(checkOut, checkOut)?.split("–")[0] : "Add date"}</div>
          </button>
        </div>
        <button
          type="button"
          className="w-full px-3 py-3 text-left"
          onClick={() => setOpen(open === "guests" ? null : "guests")}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wide">Guests</div>
          <div className="text-sm">
            {guests} guest{guests === 1 ? "" : "s"}
          </div>
        </button>
        {open === "dates" && (
          <div className="absolute left-1/2 top-full z-30 mt-2 w-[760px] -translate-x-1/2 rounded-[20px] bg-white shadow-lift">
            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              blocked={blocked}
              onChange={(a, b) => {
                onDatesChange(a, b);
                if (a && b) setOpen(null);
              }}
            />
          </div>
        )}
        {open === "guests" && (
          <div className="absolute right-0 top-full z-30 mt-2 rounded-[20px] bg-white shadow-lift">
            <GuestPicker
              adults={adults}
              childrenCount={childrenCount}
              infants={0}
              pets={0}
              maxGuests={listing.max_guests}
              onChange={(next) => onGuestsChange(next.adults, next.childrenCount)}
            />
          </div>
        )}
      </div>

      <Button className="mt-4 w-full" onClick={onReserve} disabled={submitting || !checkIn || !checkOut}>
        {submitting ? "Processing…" : "Reserve"}
      </Button>
      <p className="mt-3 text-center text-sm text-text-secondary">You won&apos;t be charged yet</p>
      {quoteLoading ? <p className="mt-4 text-sm text-text-secondary">Getting price…</p> : null}
      {quoteError ? <p className="mt-4 text-sm text-error">{quoteError}</p> : null}
      {bookingError ? <p className="mt-4 text-sm text-error">{bookingError}</p> : null}
      {quote ? <PriceBreakdown quote={quote} /> : null}
    </aside>
  );
}
