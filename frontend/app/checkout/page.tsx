"use client";

import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StarIcon } from "@/components/ui/Icons";
import { useCurrentUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { formatDateRange, formatRating } from "@/lib/format";
import { ApiError, type ListingDetail, type PriceQuote } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { showToast } = useToast();

  const listingId = Number(params.get("listing"));
  const checkIn = params.get("check_in") ?? "";
  const checkOut = params.get("check_out") ?? "";
  const guests = Number(params.get("guests") ?? 1);

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nameOnCard, setNameOnCard] = useState("");

  useEffect(() => {
    if (!listingId || !checkIn || !checkOut) {
      setError("Missing trip details. Return to the listing and reserve again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      api.getListing(listingId),
      api.getPriceQuote(listingId, checkIn, checkOut, guests),
    ])
      .then(([detail, price]) => {
        setListing(detail);
        setQuote(price);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load checkout"))
      .finally(() => setLoading(false));
  }, [listingId, checkIn, checkOut, guests]);

  const pay = async () => {
    if (!currentUser) {
      showToast("Pick a mock user in the account menu first.", "error");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const booking = await api.createBooking({
        listing_id: listingId,
        check_in: checkIn,
        check_out: checkOut,
        guests,
      });
      showToast("Booking confirmed");
      router.push(`/booked?id=${booking.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const message = "Those dates are no longer available. Choose different dates.";
        setError(message);
        showToast(message, "error");
        return;
      }
      const message = err instanceof Error ? err.message : "Could not complete booking";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="listing-detail-gutter py-16">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-10 h-80" />
      </div>
    );
  }

  if (!listing || !quote) {
    return (
      <ErrorState
        message={error ?? "Checkout is unavailable"}
        onRetry={() => router.push(listingId ? `/listing/${listingId}` : "/")}
      />
    );
  }

  const cover = listing.images.slice().sort((a, b) => a.position - b.position)[0];
  const rating = formatRating(listing.review_summary.average_rating);

  return (
    <div className="listing-detail-gutter grid grid-cols-[1fr_400px] gap-20 py-12">
      <div>
        <h1 className="text-[32px] font-semibold leading-[38px]">Confirm and pay</h1>
        <section className="mt-10">
          <h2 className="text-[22px] font-semibold">Your trip</h2>
          <div className="mt-6 flex justify-between">
            <div>
              <p className="font-semibold">Dates</p>
              <p className="text-text-secondary">{formatDateRange(checkIn, checkOut)}</p>
            </div>
            <button type="button" className="font-semibold underline" onClick={() => router.back()}>
              Edit
            </button>
          </div>
          <div className="mt-6 flex justify-between">
            <div>
              <p className="font-semibold">Guests</p>
              <p className="text-text-secondary">
                {guests} guest{guests === 1 ? "" : "s"}
              </p>
            </div>
            <button type="button" className="font-semibold underline" onClick={() => router.back()}>
              Edit
            </button>
          </div>
        </section>

        <section className="mt-12 border-t border-border-default pt-10">
          <h2 className="text-[22px] font-semibold">Pay with</h2>
          <p className="mt-2 text-sm text-text-secondary">Demo checkout — no real payment is processed.</p>
          <div className="mt-6 space-y-4">
            <Field label="Card number" placeholder="•••• •••• •••• ••••" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Expiration" placeholder="MM / YY" />
              <Field label="CVV" placeholder="123" />
            </div>
            <label className="block text-xs font-semibold">
              Name on card
              <input
                value={nameOnCard}
                onChange={(e) => setNameOnCard(e.target.value)}
                className="mt-2 h-14 w-full rounded-lg border border-border-strong bg-surface-raised text-text-primary px-4 text-base font-normal focus:outline-none"
              />
            </label>
            <Field label="Country/region" placeholder="India" />
          </div>
        </section>

        {error ? <p className="mt-6 text-error">{error}</p> : null}

        <Button className="mt-10 w-auto min-w-[220px]" disabled={submitting} onClick={() => void pay()}>
          {submitting ? "Processing…" : "Confirm and pay"}
        </Button>
        {error?.includes("no longer available") ? (
          <Button
            variant="secondary"
            className="ml-3 w-auto"
            onClick={() => router.push(`/listing/${listingId}`)}
          >
            Choose different dates
          </Button>
        ) : null}
      </div>

      <aside className="sticky top-[120px] h-fit rounded-xl border border-border-default bg-surface-raised text-text-primary p-6 shadow-lift">
        <div className="flex gap-4">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt="" className="h-[90px] w-[120px] rounded-lg object-cover" />
          ) : null}
          <div>
            <p className="font-semibold">{listing.title}</p>
            <p className="text-sm text-text-secondary">
              {listing.city}, {listing.country}
            </p>
            {rating ? (
              <p className="mt-1 flex items-center gap-1 text-sm">
                <StarIcon /> {rating}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 border-t border-border-soft pt-2">
          <PriceBreakdown quote={quote} />
        </div>
      </aside>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block text-xs font-semibold">
      {label}
      <input
        placeholder={placeholder}
        className="mt-2 h-14 w-full rounded-lg border border-border-strong bg-surface-raised text-text-primary px-4 text-base font-normal placeholder:text-text-disabled focus:outline-none"
      />
    </label>
  );
}
