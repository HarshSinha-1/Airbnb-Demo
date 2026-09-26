"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { api } from "@/lib/api";
import type { Amenity } from "@/lib/types";
import { useEffect, useState } from "react";

export type FilterValues = {
  min_price?: number;
  max_price?: number;
  property_type?: string;
  amenities: number[];
};

const empty: FilterValues = { amenities: [] };

export function FilterModal({
  open,
  onClose,
  value,
  onApply,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  value: FilterValues;
  onApply: (next: FilterValues) => void;
  resultCount?: number;
}) {
  const [draft, setDraft] = useState<FilterValues>(value);
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setDraft(value);
  }

  useEffect(() => {
    api.getAmenities().then(setAmenities).catch(() => setAmenities([]));
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filters"
      footer={
        <>
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => setDraft(empty)}
          >
            Clear all
          </button>
          <Button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            variant="black"
          >
            Show {resultCount != null ? resultCount : ""} places
          </Button>
        </>
      }
    >
      <section className="mb-8">
        <h3 className="mb-4 text-[22px] font-semibold">Type of place</h3>
        <div className="flex gap-3">
          <TypeChip
            label="Any type"
            active={!draft.property_type}
            onClick={() => setDraft((d) => ({ ...d, property_type: undefined }))}
          />
          {Object.entries(PROPERTY_TYPE_LABELS).map(([id, label]) => (
            <TypeChip
              key={id}
              label={label}
              active={draft.property_type === id}
              onClick={() => setDraft((d) => ({ ...d, property_type: id }))}
            />
          ))}
        </div>
      </section>
      <section className="mb-8 border-t border-border-soft pt-8">
        <h3 className="mb-4 text-[22px] font-semibold">Price range</h3>
        <div className="flex gap-4">
          <label className="flex-1 text-xs font-semibold">
            Minimum
            <input
              type="number"
              min={0}
              value={draft.min_price ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, min_price: e.target.value ? Number(e.target.value) : undefined }))
              }
              className="mt-2 h-14 w-full rounded-lg border border-border-strong px-4 text-base font-normal"
            />
          </label>
          <label className="flex-1 text-xs font-semibold">
            Maximum
            <input
              type="number"
              min={0}
              value={draft.max_price ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, max_price: e.target.value ? Number(e.target.value) : undefined }))
              }
              className="mt-2 h-14 w-full rounded-lg border border-border-strong px-4 text-base font-normal"
            />
          </label>
        </div>
      </section>
      <section className="border-t border-border-soft pt-8">
        <h3 className="mb-4 text-[22px] font-semibold">Amenities</h3>
        <div className="grid grid-cols-2 gap-3">
          {amenities.map((a) => {
            const on = draft.amenities.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    amenities: on ? d.amenities.filter((id) => id !== a.id) : [...d.amenities, a.id],
                  }))
                }
                className={`h-14 rounded-xl border px-4 text-left text-sm font-medium ${
                  on ? "border-2 border-text-primary" : "border-border-default hover:border-text-primary"
                }`}
              >
                {a.name}
              </button>
            );
          })}
        </div>
      </section>
    </Modal>
  );
}

function TypeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-full border px-4 text-sm ${
        active ? "border-text-primary font-semibold" : "border-border-default"
      }`}
    >
      {label}
    </button>
  );
}
