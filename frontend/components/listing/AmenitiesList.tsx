"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Amenity } from "@/lib/types";
import { useState } from "react";

export function AmenitiesList({ amenities }: { amenities: Amenity[] }) {
  const [open, setOpen] = useState(false);
  const preview = amenities.slice(0, 8);

  return (
    <section className="border-t border-border-default py-8">
      <h2 className="mb-6 text-[22px] font-semibold leading-7">What this place offers</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        {preview.map((a) => (
          <div key={a.id} className="flex items-center gap-4 text-base">
            <span className="flex h-6 w-6 items-center justify-center text-lg">•</span>
            {a.name}
          </div>
        ))}
      </div>
      {amenities.length > 8 ? (
        <Button variant="secondary" className="mt-8 w-auto px-6" onClick={() => setOpen(true)}>
          Show all {amenities.length} amenities
        </Button>
      ) : null}
      <Modal open={open} onClose={() => setOpen(false)} title="What this place offers" width="max-w-[560px]">
        <ul className="space-y-5">
          {amenities.map((a) => (
            <li key={a.id} className="border-b border-border-soft pb-4 text-base">
              {a.name}
            </li>
          ))}
        </ul>
      </Modal>
    </section>
  );
}
