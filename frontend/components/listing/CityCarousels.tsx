"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import type { ListingCard as ListingCardType } from "@/lib/types";
import { ListingCard } from "@/components/listing/ListingCard";

export function CityCarousels() {
  const [grouped, setGrouped] = useState<Record<string, ListingCardType[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getListings({ page_size: 100 }).then((data) => {
      const groups: Record<string, ListingCardType[]> = {};
      data.items.forEach((item) => {
        if (!groups[item.city]) {
          groups[item.city] = [];
        }
        if (groups[item.city].length < 7) {
          groups[item.city].push(item);
        }
      });
      setGrouped(groups);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  const cities = Object.keys(grouped).filter(city => grouped[city].length > 0);
  if (cities.length === 0) return null;

  return (
    <div className="page-gutter pt-8 pb-4 border-b border-border-default mb-8">
      {cities.map(city => (
        <CarouselRow key={city} city={city} listings={grouped[city]} />
      ))}
    </div>
  );
}

function CarouselRow({ city, listings }: { city: string; listings: ListingCardType[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[22px] font-semibold flex items-center gap-2 group cursor-pointer">
          Popular homes in {city}
          <svg className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </h2>
        <div className="flex gap-2">
          <button onClick={() => scroll("left")} className="flex h-8 w-8 items-center justify-center rounded-full border border-border-default bg-surface-raised text-text-primary shadow-sm hover:shadow-md hover:scale-105 transition-all">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => scroll("right")} className="flex h-8 w-8 items-center justify-center rounded-full border border-border-default bg-surface-raised text-text-primary shadow-sm hover:shadow-md hover:scale-105 transition-all">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div className="relative">
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {listings.map(listing => (
            <div key={listing.id} className="w-[300px] shrink-0 snap-start">
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
