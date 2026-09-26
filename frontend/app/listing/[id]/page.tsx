"use client";

import { AmenitiesList } from "@/components/listing/AmenitiesList";
import { PhotoGallery } from "@/components/listing/PhotoGallery";
import { WishlistButton } from "@/components/listing/WishlistButton";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";
import { BookingCard } from "@/components/booking/BookingCard";
import { ConfirmTripModal } from "@/components/booking/ConfirmTripModal";
import { RatingSummary } from "@/components/review/RatingSummary";
import { ReviewList } from "@/components/review/ReviewList";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { formatRating, isGuestFavourite, propertyTypeLabel } from "@/lib/format";
import type { AvailabilityRange, ListingDetail, PriceQuote, Review } from "@/lib/types";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";
import { ChatIcon, MapPinIcon } from "@/components/ui/Icons";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = Number(params.id);
  const { currentUser } = useCurrentUser();
  const { showToast } = useToast();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [blocked, setBlocked] = useState<AvailabilityRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<string | undefined>(searchParams.get("check_in") ?? undefined);
  const [checkOut, setCheckOut] = useState<string | undefined>(searchParams.get("check_out") ?? undefined);
  const [adults, setAdults] = useState(Math.max(1, Number(searchParams.get("guests") ?? 1)));
  const [childrenCount, setChildrenCount] = useState(0);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(false);

  const guests = adults + childrenCount;

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError("Invalid listing");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [detail, availability, reviewList] = await Promise.all([
        api.getListing(id),
        api.getAvailability(id),
        api.getReviews(id),
      ]);
      setListing(detail);
      setBlocked(availability);
      setReviews(reviewList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this listing");
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError(null);
    api
      .getPriceQuote(id, checkIn, checkOut, guests)
      .then((data) => {
        if (!cancelled) setQuote(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(err instanceof Error ? err.message : "Could not get a price quote");
        }
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, checkIn, checkOut, guests]);

  const onReserve = () => {
    if (!currentUser) {
      showToast("Pick a mock user in the account menu first.", "error");
      return;
    }
    if (!checkIn || !checkOut || !quote) {
      setBookingError("Select available dates to see the price before reserving.");
      return;
    }
    setBookingError(null);
    setConfirmOpen(true);
  };

  const goCheckout = () => {
    const q = new URLSearchParams({
      listing: String(id),
      check_in: checkIn!,
      check_out: checkOut!,
      guests: String(guests),
    });
    router.push(`/checkout?${q.toString()}`);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link copied");
    } catch {
      showToast("Could not copy link", "error");
    }
  };

  if (loading) {
    return (
      <div className="listing-detail-gutter py-8">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-6 h-[500px] rounded-xl" />
      </div>
    );
  }

  if (error || !listing) {
    return <ErrorState message={error ?? "Listing not found"} onRetry={() => void load()} />;
  }

  const favourite = isGuestFavourite(
    listing.review_summary.average_rating,
    listing.review_summary.review_count,
  );
  const rating = formatRating(listing.review_summary.average_rating);
  const description = listing.description;
  const shortDesc = description.length > 360 && !descOpen ? `${description.slice(0, 360)}…` : description;

  return (
    <div className="listing-detail-gutter pb-24 pt-6">
      <div className="mb-6 flex items-start justify-between gap-8">
        <div>
          <h1 className="text-[26px] font-semibold leading-8">{listing.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[15px]">
            {rating ? (
              <span className="font-semibold">★ {rating}</span>
            ) : (
              <span className="text-text-secondary">New</span>
            )}
            <span>·</span>
            <span className="underline">{listing.review_summary.review_count} reviews</span>
            <span>·</span>
            <span className="underline">
              {listing.city}, {listing.country}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 pt-1">
          <button type="button" className="flex items-center gap-2 font-semibold underline" onClick={() => void share()}>
            Share
          </button>
          <span className="flex items-center gap-2 font-semibold underline">
            <WishlistButton listingId={listing.id} />
            Save
          </span>
        </div>
      </div>

      <PhotoGallery images={listing.images} title={listing.title} />

      <div className="mt-12 flex flex-col md:flex-row items-start gap-10 md:gap-20">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-6 pb-8">
            <div>
              <h2 className="text-[22px] font-semibold leading-7">
                Entire {propertyTypeLabel(listing.property_type)} hosted by {listing.host.name}
              </h2>
              <p className="mt-1 text-[16px] text-text-body">
                {listing.max_guests} guests · {listing.bedrooms} bedrooms · {listing.beds} beds · {listing.bathrooms}{" "}
                bathrooms
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={listing.host.avatar_url}
              alt=""
              className="h-14 w-14 rounded-full object-cover"
            />
          </div>

          {favourite ? (
            <div className="mb-8 rounded-xl border border-border-default px-6 py-5">
              <p className="font-semibold">Guest favourite</p>
              <p className="mt-1 text-sm text-text-secondary">
                One of the most loved homes on Airbnb, according to guests.
              </p>
            </div>
          ) : null}

          <div className="space-y-5 border-t border-border-default py-8">
            <Highlight
              title={listing.host.is_superhost ? `${listing.host.name} is a Superhost` : `Hosted by ${listing.host.name}`}
              body="Experienced hosts who are committed to providing great stays for guests."
            />
            <Highlight
              title="Great location"
              body={`Guests stay in ${listing.city}, ${listing.country}.`}
            />
            <Highlight
              title={`${listing.max_guests} guests maximum`}
              body="Choose dates on the calendar to see live availability from the host."
            />
          </div>

          <div className="border-t border-border-default py-8">
            <p className="max-w-[620px] text-base leading-6 text-text-body">{shortDesc}</p>
            {description.length > 360 ? (
              <button
                type="button"
                className="mt-4 font-semibold underline"
                onClick={() => setDescOpen((v) => !v)}
              >
                {descOpen ? "Show less" : "Show more >"}
              </button>
            ) : null}
          </div>

          <AmenitiesList amenities={listing.amenities} />
          <AvailabilityCalendar
            city={listing.city}
            checkIn={checkIn}
            checkOut={checkOut}
            blocked={blocked}
            onChange={(a, b) => {
              setCheckIn(a);
              setCheckOut(b);
              setBookingError(null);
            }}
          />
        </div>

        <BookingCard
          listing={listing}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          adults={adults}
          childrenCount={childrenCount}
          quote={quote}
          quoteLoading={quoteLoading}
          quoteError={quoteError}
          blocked={blocked}
          bookingError={bookingError}
          submitting={false}
          onDatesChange={(a, b) => {
            setCheckIn(a);
            setCheckOut(b);
            setBookingError(null);
          }}
          onGuestsChange={(nextAdults, nextChildren) => {
            setAdults(nextAdults);
            setChildrenCount(nextChildren);
          }}
          onReserve={onReserve}
        />
      </div>

      {listing.review_summary.review_count > 0 ? (
        <RatingSummary
          average={listing.review_summary.average_rating}
          count={listing.review_summary.review_count}
        />
      ) : null}
      <div className="pb-8">
        <ReviewList reviews={reviews} />
      </div>

      <div className="border-t border-border-default py-12">
        <h2 className="text-[22px] font-semibold leading-7 mb-6">Where you&apos;ll be</h2>
        <ComingSoonBadge
          className="h-[400px] w-full"
          icon={<MapPinIcon className="h-8 w-8" />}
          label="Interactive map"
          description={`Location: ${listing.lat}, ${listing.lng}`}
        />
      </div>

      <div className="border-t border-border-default py-12">
        <h2 className="text-[22px] font-semibold leading-7 mb-4">Meet your host</h2>
        <div className="flex items-center gap-4 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing.host.avatar_url}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
          <div>
            <p className="text-xl font-semibold">Hosted by {listing.host.name}</p>
            <p className="text-sm text-text-secondary">Joined recently</p>
          </div>
        </div>
        <ComingSoonBadge
          className="max-w-[400px]"
          icon={<ChatIcon className="h-6 w-6" />}
          label="Message Host"
          description={`Have a question for ${listing.host.name}? You'll soon be able to chat directly.`}
        />
      </div>

      {confirmOpen && checkIn && checkOut && quote ? (
        <ConfirmTripModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          listing={listing}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          quote={quote}
          onContinue={goCheckout}
        />
      ) : null}
    </div>
  );
}

function Highlight({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm text-text-secondary">{body}</p>
    </div>
  );
}
