"use client";

import { HostListingTable } from "@/components/host/HostListingTable";
import { HostReservationList } from "@/components/host/HostReservationList";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { parseISODate } from "@/lib/format";
import { formatPrice } from "@/lib/formatPrice";
import { ApiError, type Booking, type HostListingCard } from "@/lib/types";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function HostDashboardPage() {
  const { currentUser, refreshUsers } = useCurrentUser();
  const { showToast } = useToast();
  const [listings, setListings] = useState<HostListingCard[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [becoming, setBecoming] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser?.is_host) {
      setListings([]);
      setBookings([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [hostListings, hostBookings] = await Promise.all([
        api.getHostListings(),
        api.getHostBookings(),
      ]);
      setListings(hostListings);
      setBookings(hostBookings);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 403
          ? "You don't have permission to view host data for this user."
          : err instanceof Error
            ? err.message
            : "Could not load host dashboard";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookings.filter((b) => b.status !== "cancelled" && parseISODate(b.check_in) >= today);
  }, [bookings]);

  const earnings = upcoming.reduce((sum, b) => sum + b.total_price, 0);

  const confirmDelete = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await api.deleteListing(deleteId);
      showToast("Listing deleted");
      setDeleteId(null);
      await load();
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 403
          ? "You don't have permission to delete this listing."
          : err instanceof Error
            ? err.message
            : "Could not delete listing";
      showToast(message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const becomeHost = async () => {
    setBecoming(true);
    try {
      await api.becomeHost();
      await refreshUsers();
      showToast("You're now a host");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not become a host", "error");
    } finally {
      setBecoming(false);
    }
  };

  if (!currentUser) {
    return (
      <EmptyState
        title="Choose a mock user"
        body="Switch to a host in the account menu. Hosts are labelled in the dropdown."
      />
    );
  }

  if (!currentUser.is_host) {
    return (
      <div className="mx-auto max-w-[760px] py-20 text-center">
        <h1 className="text-[32px] font-semibold">Airbnb your home</h1>
        <p className="mt-3 text-text-secondary">
          {currentUser.name} is a guest. Become a host on this mock account, or switch to a user marked Host.
        </p>
        <div className="mt-8 flex justify-center">
          <Button disabled={becoming} onClick={() => void becomeHost()}>
            {becoming ? "Working…" : "Become a host"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-12 pb-24 pt-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-semibold leading-[38px]">Welcome back, {currentUser.name}</h1>
          <p className="mt-2 text-text-secondary">Manage your listings and reservations.</p>
        </div>
        <Link href="/host/listings/new">
          <Button>Create new listing</Button>
        </Link>
      </div>

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      {loading ? (
        <div className="mt-10 grid grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-3 gap-4">
            <Stat label="Active listings" value={String(listings.length)} />
            <Stat label="Upcoming reservations" value={String(upcoming.length)} />
            <Stat label="Upcoming earnings" value={formatPrice(earnings, upcoming[0]?.currency ?? "USD", true)} />
          </div>

          <h2 className="mb-4 mt-16 text-[22px] font-semibold">Your listings</h2>
          {listings.length === 0 ? (
            <EmptyState
              title="No listings yet"
              body="Publish a home so guests can find you in search."
              action={
                <Link href="/host/listings/new">
                  <Button>Create new listing</Button>
                </Link>
              }
            />
          ) : (
            <HostListingTable listings={listings} onDelete={setDeleteId} />
          )}

          <h2 className="mb-4 mt-16 text-[22px] font-semibold">Upcoming reservations</h2>
          {upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming reservations"
              body="When guests book your listings, they will show up here."
            />
          ) : (
            <HostReservationList bookings={upcoming} />
          )}
        </>
      )}

      <Modal
        open={deleteId != null}
        onClose={() => setDeleteId(null)}
        title="Delete this listing?"
        width="max-w-[440px]"
        footer={
          <>
            <button type="button" className="font-semibold underline" onClick={() => setDeleteId(null)}>
              Cancel
            </button>
            <Button variant="danger" disabled={deleting} onClick={() => void confirmDelete()}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-text-secondary">
          This action can&apos;t be undone. Guests will no longer be able to find this listing.
        </p>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-default p-6">
      <p className="text-[32px] font-semibold">{value}</p>
      <p className="mt-1 text-text-secondary">{label}</p>
    </div>
  );
}
