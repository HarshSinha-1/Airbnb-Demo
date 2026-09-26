"use client";

import { TripCard } from "@/components/booking/TripCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { parseISODate } from "@/lib/format";
import { ApiError, type Booking } from "@/lib/types";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Tab = "upcoming" | "past" | "cancelled";

export default function TripsPage() {
  const { currentUser } = useCurrentUser();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!currentUser) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyBookings();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load trips");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void load();
  }, [load]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filtered = bookings.filter((b) => {
    const cancelled = b.status === "cancelled";
    const end = parseISODate(b.check_out);
    if (tab === "cancelled") return cancelled;
    if (cancelled) return false;
    if (tab === "past") return end < today;
    return end >= today;
  });

  const cancel = async (id: number) => {
    setCancellingId(id);
    try {
      await api.cancelBooking(id);
      showToast("Reservation cancelled");
      await load();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not cancel this reservation";
      showToast(message, "error");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-12 pb-24 pt-10">
      <h1 className="text-[32px] font-semibold leading-[38px]">Trips</h1>
      <div className="mt-8 flex gap-8 border-b border-border-soft">
        {(["upcoming", "past", "cancelled"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`pb-3 capitalize ${
              tab === item
                ? "border-b-2 border-text-primary font-semibold"
                : "text-text-secondary"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {!currentUser ? (
        <EmptyState
          title="Choose a mock user"
          body="Use the account menu to act as a guest, then your bookings will appear here."
        />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading ? (
        <div className="mt-10 space-y-6">
          <Skeleton className="h-[260px] rounded-xl" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No trips booked...yet!"
          body="Time to dust off your bags and start planning your next adventure."
          action={
            <Link href="/">
              <Button>Start searching</Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-10 space-y-8">
          {filtered.map((booking) => (
            <TripCard
              key={booking.id}
              booking={booking}
              cancelling={cancellingId === booking.id}
              onCancel={tab === "upcoming" ? () => void cancel(booking.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
