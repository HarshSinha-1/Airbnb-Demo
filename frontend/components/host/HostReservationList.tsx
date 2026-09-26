import { formatDateRange, formatMoney } from "@/lib/format";
import type { Booking } from "@/lib/types";

export function HostReservationList({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="divide-y divide-border-soft">
      {bookings.map((booking) => (
        <div key={booking.id} className="flex items-center justify-between py-5">
          <div>
            <div className="font-semibold">{booking.guest_name ?? `Guest ${booking.guest_id}`}</div>
            <div className="text-sm text-text-secondary">{booking.listing_title}</div>
            <div className="text-sm text-text-secondary">
              {formatDateRange(booking.check_in, booking.check_out)} · {booking.guests} guests
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{formatMoney(booking.total_price, true)}</div>
            <div className="text-sm capitalize text-text-secondary">{booking.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
