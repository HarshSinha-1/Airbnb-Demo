"use client";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { confirmationCode, formatDateRange } from "@/lib/format";
import type { Booking } from "@/lib/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BookedPage() {
  const params = useSearchParams();
  const id = Number(params.get("id"));
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No confirmation id");
      setLoading(false);
      return;
    }
    api
      .getMyBookings()
      .then((list) => {
        const found = list.find((b) => b.id === id) ?? null;
        setBooking(found);
        if (!found) setError("We couldn't find that booking for this user.");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load confirmation"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[600px] py-20">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto mt-8 h-10 w-80" />
      </div>
    );
  }

  if (error || !booking) {
    return <ErrorState message={error ?? "Booking not found"} />;
  }

  return (
    <div className="mx-auto max-w-[600px] py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success text-2xl text-white">
        ✓
      </div>
      <h1 className="mt-8 text-[32px] font-semibold leading-[38px]">Your trip is booked</h1>
      <p className="mt-3 text-text-secondary">
        You&apos;re going to {booking.listing_city ?? "your destination"}.
      </p>
      <div className="mt-10 rounded-xl border border-border-default p-6 text-left">
        <p className="text-[22px] font-semibold">{booking.listing_title}</p>
        <p className="mt-2 text-text-secondary">{formatDateRange(booking.check_in, booking.check_out)}</p>
        <p className="mt-1 text-text-secondary">
          {booking.guests} guest{booking.guests === 1 ? "" : "s"}
        </p>
        <p className="mt-4 text-sm text-text-secondary">Confirmation code</p>
        <p className="font-semibold tracking-wide">{confirmationCode(booking.id)}</p>
      </div>
      <div className="mt-10 flex justify-center gap-3">
        <Link href="/trips">
          <Button>View trip</Button>
        </Link>
        <Link href="/">
          <Button variant="secondary">Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
