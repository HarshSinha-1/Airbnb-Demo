"use client";

import { DateRangePicker } from "@/components/booking/DateRangePicker";
import { GuestPicker } from "@/components/booking/GuestPicker";
import { SearchIcon } from "@/components/ui/Icons";
import { DESTINATION_SUGGESTIONS } from "@/lib/constants";
import { formatDateRange } from "@/lib/format";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [location, setLocation] = useState(params.get("location") ?? "");
  const [checkIn, setCheckIn] = useState(params.get("check_in") ?? "");
  const [checkOut, setCheckOut] = useState(params.get("check_out") ?? "");
  const [adults, setAdults] = useState(Number(params.get("adults") ?? 0) || 0);
  const [childrenCount, setChildrenCount] = useState(Number(params.get("children") ?? 0) || 0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);
  const [open, setOpen] = useState<"where" | "when" | "who" | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocation(params.get("location") ?? "");
    setCheckIn(params.get("check_in") ?? "");
    setCheckOut(params.get("check_out") ?? "");
    const g = Number(params.get("guests") ?? 0);
    if (g && !params.get("adults")) {
      setAdults(g);
    }
  }, [params]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const guests = adults + childrenCount;
  const datesLabel = formatDateRange(checkIn, checkOut) ?? "Add dates";
  const whoLabel = guests ? `${guests} guest${guests === 1 ? "" : "s"}` : "Add guests";

  const submit = (nextLocation = location) => {
    const q = new URLSearchParams();
    if (nextLocation) q.set("location", nextLocation);
    if (checkIn) q.set("check_in", checkIn);
    if (checkOut) q.set("check_out", checkOut);
    if (guests) q.set("guests", String(guests));
    const category = params.get("category");
    if (category && pathname === "/search") q.set("category", category);
    router.push(`/search?${q.toString()}`);
    setOpen(null);
  };

  if (compact) {
    return (
      <button
        onClick={() => router.push("/search")}
        className="mx-auto flex h-12 items-center gap-3 rounded-full border border-border-default bg-white px-2 pl-6 text-sm shadow-float hover:shadow-lift"
      >
        <span className="font-semibold">Anywhere</span>
        <span className="h-6 w-px bg-border-default" />
        <span className="font-semibold">Any week</span>
        <span className="h-6 w-px bg-border-default" />
        <span className="text-text-secondary">Add guests</span>
        <span className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-rausch text-white">
          <SearchIcon />
        </span>
      </button>
    );
  }

  return (
    <div ref={wrap} className="relative mx-auto w-[min(850px,100%)]">
      <div className="flex h-[66px] items-center rounded-full border border-border-default bg-white shadow-float">
        <button
          type="button"
          onClick={() => setOpen(open === "where" ? null : "where")}
          className={`flex h-full w-[38%] flex-col justify-center rounded-full px-8 text-left hover:bg-surface-soft ${open === "where" ? "bg-white shadow-float" : ""}`}
        >
          <span className="text-[12px] font-semibold leading-4">Where</span>
          <span className={`truncate text-sm ${location ? "text-text-primary" : "text-text-secondary"}`}>
            {location || "Search destinations"}
          </span>
        </button>
        <span className="h-8 w-px bg-border-default" />
        <button
          type="button"
          onClick={() => setOpen(open === "when" ? null : "when")}
          className={`flex h-full w-[28%] flex-col justify-center rounded-full px-6 text-left hover:bg-surface-soft ${open === "when" ? "bg-white shadow-float" : ""}`}
        >
          <span className="text-[12px] font-semibold leading-4">When</span>
          <span className={`truncate text-sm ${checkIn ? "text-text-primary" : "text-text-secondary"}`}>
            {datesLabel}
          </span>
        </button>
        <span className="h-8 w-px bg-border-default" />
        <div
          className={`flex h-full min-w-0 flex-1 items-center rounded-full pr-2 hover:bg-surface-soft ${open === "who" ? "bg-white shadow-float" : ""}`}
        >
          <button
            type="button"
            onClick={() => setOpen(open === "who" ? null : "who")}
            className="flex h-full flex-1 flex-col justify-center px-6 text-left"
          >
            <span className="text-[12px] font-semibold leading-4">Who</span>
            <span className={`truncate text-sm ${guests ? "text-text-primary" : "text-text-secondary"}`}>
              {whoLabel}
            </span>
          </button>
          <button
            type="button"
            onClick={() => submit()}
            className="mr-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rausch text-white transition-colors hover:bg-rausch-hover active:bg-rausch-active"
            aria-label="Search"
          >
            <SearchIcon />
          </button>
        </div>
      </div>

      {open === "where" && (
        <div className="absolute left-0 top-[78px] z-40 h-[430px] w-[430px] overflow-hidden rounded-[20px] bg-white p-6 shadow-lift">
          <p className="mb-4 text-sm font-semibold">Suggested destinations</p>
          <div>
            {DESTINATION_SUGGESTIONS.map((item) => (
              <button
                key={item.query}
                type="button"
                className="flex h-14 w-full items-center gap-4 rounded-xl px-2 text-left hover:bg-surface-soft"
                onClick={() => {
                  setLocation(item.query);
                  setOpen("when");
                }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-raised text-lg">
                  📍
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {open === "when" && (
        <div className="absolute left-1/2 top-[78px] z-40 w-[min(820px,calc(100vw-64px))] -translate-x-1/2 rounded-[20px] bg-white shadow-lift">
          <DateRangePicker
            checkIn={checkIn || undefined}
            checkOut={checkOut || undefined}
            onChange={(a, b) => {
              setCheckIn(a ?? "");
              setCheckOut(b ?? "");
              if (a && b) setOpen("who");
            }}
          />
        </div>
      )}

      {open === "who" && (
        <div className="absolute right-0 top-[78px] z-40 rounded-[20px] bg-white shadow-lift">
          <GuestPicker
            adults={Math.max(adults, 1)}
            childrenCount={childrenCount}
            infants={infants}
            pets={pets}
            onChange={(next) => {
              setAdults(next.adults);
              setChildrenCount(next.childrenCount);
              setInfants(next.infants);
              setPets(next.pets);
            }}
          />
        </div>
      )}
    </div>
  );
}
