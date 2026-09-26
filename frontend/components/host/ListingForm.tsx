"use client";

import { Button } from "@/components/ui/Button";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";
import { CheckShieldIcon } from "@/components/ui/Icons";
import { api } from "@/lib/api";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import type { Amenity, Category, ListingCreate, ListingDetail } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

const STEPS = ["About your place", "Details", "Photos", "Pricing"];

export type ListingFormValues = ListingCreate;

function fromListing(listing: ListingDetail): ListingFormValues {
  return {
    title: listing.title,
    description: listing.description,
    property_type: listing.property_type,
    category: listing.category,
    city: listing.city,
    country: listing.country,
    lat: listing.lat,
    lng: listing.lng,
    price_per_night: listing.price_per_night,
    cleaning_fee: listing.cleaning_fee,
    max_guests: listing.max_guests,
    bedrooms: listing.bedrooms,
    beds: listing.beds,
    bathrooms: listing.bathrooms,
    image_urls: listing.images.map((i) => i.url),
    amenity_ids: listing.amenities.map((a) => a.id),
  };
}

const blank: ListingFormValues = {
  title: "",
  description: "",
  property_type: "house",
  category: "",
  city: "",
  country: "",
  price_per_night: 100,
  cleaning_fee: 0,
  max_guests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  image_urls: [],
  amenity_ids: [],
};

export function ListingForm({
  initial,
  submitLabel,
  onSubmit,
  onDelete,
  saving,
  error,
}: {
  initial?: ListingDetail;
  submitLabel: string;
  onSubmit: (values: ListingFormValues) => Promise<void>;
  onDelete?: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<ListingFormValues>(initial ? fromListing(initial) : blank);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    api.getAmenities().then(setAmenities).catch(() => setAmenities([]));
    api.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (initial) setValues(fromListing(initial));
  }, [initial]);

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(values.property_type && values.city && values.country);
    if (step === 1) return values.title.trim().length >= 3 && values.description.trim().length >= 10;
    if (step === 2) return (values.image_urls?.length ?? 0) >= 1;
    return values.price_per_night > 0;
  }, [step, values]);

  const set = <K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  return (
    <div className="mx-auto max-w-[760px] pb-24 pt-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-[32px] font-semibold leading-[38px]">
          {initial ? "Edit listing" : "Create a new listing"}
        </h1>
      </div>
      <ComingSoonBadge
        className="mb-8"
        icon={<CheckShieldIcon className="h-6 w-6" />}
        label="Identity Verification"
        description="Before publishing a live listing, you will need to verify your identity."
      />
      <ol className="mb-10 flex gap-6 text-sm text-text-secondary">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? "font-semibold text-text-primary" : ""}>
            {i + 1} {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-10">
          <section>
            <h2 className="mb-6 text-[22px] font-semibold">Which of these best describes your place?</h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(PROPERTY_TYPE_LABELS).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => set("property_type", id)}
                  className={`h-[100px] rounded-xl border px-5 text-left font-semibold ${
                    values.property_type === id ? "border-2 border-text-primary" : "border-border-default hover:border-text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-6 text-[22px] font-semibold">Category</h2>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => set("category", c.id)}
                  className={`h-14 rounded-xl border text-sm font-medium ${
                    values.category === c.id ? "border-2 border-text-primary" : "border-border-default"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-6 text-[22px] font-semibold">Where&apos;s your place located?</h2>
            <div className="space-y-4">
              <Field label="Country / region" value={values.country} onChange={(v) => set("country", v)} />
              <Field label="City" value={values.city} onChange={(v) => set("city", v)} />
            </div>
          </section>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-8">
          <h2 className="text-[22px] font-semibold">Share some basics</h2>
          {(["max_guests", "bedrooms", "beds", "bathrooms"] as const).map((key) => (
            <div key={key} className="flex h-[72px] items-center justify-between border-b border-border-soft">
              <span className="capitalize">{key.replace("max_guests", "Guests").replace("_", " ")}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="h-8 w-8 rounded-full border"
                  onClick={() => set(key, Math.max(key === "beds" || key === "max_guests" ? 1 : 0, (values[key] ?? 0) - 1))}
                >
                  −
                </button>
                <span>{values[key]}</span>
                <button type="button" className="h-8 w-8 rounded-full border" onClick={() => set(key, (values[key] ?? 0) + 1)}>
                  +
                </button>
              </div>
            </div>
          ))}
          <Field label="Title" value={values.title} onChange={(v) => set("title", v)} />
          <label className="block text-xs font-semibold">
            Description
            <textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className="mt-2 min-h-[180px] w-full rounded-lg border border-border-strong p-4 text-base font-normal"
            />
            <span className="mt-1 block text-right font-normal text-text-secondary">{values.description.length} characters</span>
          </label>
          <h2 className="text-[22px] font-semibold">Tell guests what your place has to offer</h2>
          <div className="grid grid-cols-3 gap-3">
            {amenities.map((a) => {
              const on = values.amenity_ids?.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    set(
                      "amenity_ids",
                      on ? (values.amenity_ids ?? []).filter((id) => id !== a.id) : [...(values.amenity_ids ?? []), a.id],
                    )
                  }
                  className={`h-[88px] rounded-xl border text-sm font-medium ${
                    on ? "border-2 border-text-primary" : "border-border-default"
                  }`}
                >
                  {a.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="mb-2 text-[22px] font-semibold">Add photos</h2>
          <p className="mb-6 text-text-secondary">Paste image URLs. The first photo becomes the cover.</p>
          <div className="mb-6 flex h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border-strong">
            <p className="text-lg font-semibold">Add photo URLs</p>
            <div className="mt-4 flex w-full max-w-md gap-2 px-6">
              <input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://…"
                className="h-12 flex-1 rounded-lg border border-border-strong px-3"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (!photoUrl.trim()) return;
                  set("image_urls", [...(values.image_urls ?? []), photoUrl.trim()]);
                  setPhotoUrl("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(values.image_urls ?? []).map((url, i) => (
              <div key={`${url}-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-40 w-full rounded-lg object-cover" />
                {i === 0 ? (
                  <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-xs font-semibold">
                    Cover photo
                  </span>
                ) : null}
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-xs"
                  onClick={() => set("image_urls", (values.image_urls ?? []).filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="mb-6 text-[22px] font-semibold">Set your nightly price</h2>
          <label className="text-sm font-semibold">
            Nightly price (USD)
            <input
              type="number"
              min={1}
              value={values.price_per_night}
              onChange={(e) => set("price_per_night", Number(e.target.value))}
              className="mt-2 h-20 w-full rounded-lg border border-border-strong px-4 text-4xl"
            />
          </label>
          <label className="mt-6 block text-sm font-semibold">
            Cleaning fee
            <input
              type="number"
              min={0}
              value={values.cleaning_fee}
              onChange={(e) => set("cleaning_fee", Number(e.target.value))}
              className="mt-2 h-14 w-full rounded-lg border border-border-strong px-4 text-base font-normal"
            />
          </label>
          <p className="mt-4 text-sm text-text-secondary">Service fee is calculated by the backend when guests book.</p>
        </div>
      )}

      {error ? <p className="mt-6 text-error">{error}</p> : null}

      <div className="fixed bottom-0 left-0 right-0 border-t border-border-soft bg-white">
        <div className="mx-auto flex max-w-[760px] items-center justify-between py-4">
          <button
            type="button"
            className="font-semibold underline disabled:opacity-40"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </button>
          <div className="flex gap-3">
            {onDelete ? (
              <Button type="button" variant="danger" onClick={onDelete}>
                Delete listing
              </Button>
            ) : null}
            {step < 3 ? (
              <Button type="button" variant="black" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Next
              </Button>
            ) : (
              <Button type="button" disabled={saving || !canNext} onClick={() => void onSubmit(values)}>
                {saving ? "Saving…" : submitLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs font-semibold">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-14 w-full rounded-lg border border-border-strong px-4 text-base font-normal"
      />
    </label>
  );
}
