"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { ListingImage } from "@/lib/types";

export function PhotoGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const [open, setOpen] = useState(false);
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const slots = [0, 1, 2, 3, 4].map((i) => sorted[i]);

  return (
    <>
      <div className="relative h-[500px] overflow-hidden rounded-xl">
        <div className="grid h-full grid-cols-4 grid-rows-2 gap-2">
          <button
            type="button"
            className="col-span-2 row-span-2 overflow-hidden"
            onClick={() => setOpen(true)}
          >
            {slots[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={slots[0].url} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full bg-surface-raised" />
            )}
          </button>
          {slots.slice(1).map((img, i) => (
            <button key={img?.id ?? i} type="button" className="overflow-hidden" onClick={() => setOpen(true)}>
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full bg-surface-raised" />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute bottom-4 right-4 h-10 rounded-lg border border-text-primary bg-white px-4 text-sm font-semibold"
        >
          Show all photos
        </button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Photo tour" width="max-w-5xl">
        <div className="grid grid-cols-2 gap-2">
          {sorted.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id} src={img.url} alt="" className="w-full rounded-lg object-cover" />
          ))}
        </div>
      </Modal>
    </>
  );
}
