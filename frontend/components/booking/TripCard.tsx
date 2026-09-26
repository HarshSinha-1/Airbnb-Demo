import { formatDateRange, formatMoney } from "@/lib/format";
import type { Booking } from "@/lib/types";
import Link from "next/link";

export function TripCard({
  booking,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onCancel?: () => void;
  cancelling?: boolean;
}) {
  return (
    <article className="flex overflow-hidden rounded-xl border border-border-default">
      {booking.listing_cover_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={booking.listing_cover_image} alt="" className="h-[260px] w-[380px] object-cover" />
      ) : (
        <div className="h-[260px] w-[380px] bg-surface-raised" />
      )}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <p className="text-sm capitalize text-text-secondary">{booking.status}</p>
          <h3 className="mt-1 text-[22px] font-semibold">{booking.listing_city}</h3>
          <p className="mt-1 text-text-body">{booking.listing_title}</p>
          <p className="mt-2 text-text-secondary">
            {formatDateRange(booking.check_in, booking.check_out)} · {booking.guests} guests
          </p>
          <p className="mt-2 font-semibold">{formatMoney(booking.total_price, true)}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/listing/${booking.listing_id}`}
            className="inline-flex h-12 items-center rounded-lg border border-text-primary px-5 font-semibold"
          >
            View reservation
          </Link>
          {onCancel && booking.status !== "cancelled" ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelling}
              className="h-12 rounded-lg px-5 font-semibold text-error"
            >
              {cancelling ? "Cancelling…" : "Cancel reservation"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
