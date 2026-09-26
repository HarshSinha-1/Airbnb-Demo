"use client";

import { DateRangePicker } from "@/components/booking/DateRangePicker";
import { formatDateRange, nightsBetween } from "@/lib/format";
import type { AvailabilityRange } from "@/lib/types";

export function AvailabilityCalendar({
  city,
  checkIn,
  checkOut,
  blocked,
  onChange,
}: {
  city: string;
  checkIn?: string;
  checkOut?: string;
  blocked: AvailabilityRange[];
  onChange: (checkIn?: string, checkOut?: string) => void;
}) {
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  return (
    <section className="border-t border-border-default py-12">
      <h2 className="text-[22px] font-semibold">
        {nights ? `${nights} night${nights === 1 ? "" : "s"} in ${city}` : `Select dates in ${city}`}
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        {checkIn && checkOut ? formatDateRange(checkIn, checkOut) : "Add your travel dates for exact pricing"}
      </p>
      <div className="mt-6">
        <DateRangePicker checkIn={checkIn} checkOut={checkOut} blocked={blocked} onChange={onChange} />
      </div>
    </section>
  );
}
