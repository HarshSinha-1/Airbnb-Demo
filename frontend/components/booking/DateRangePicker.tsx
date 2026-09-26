"use client";

import { parseISODate, toISODate } from "@/lib/format";
import type { AvailabilityRange } from "@/lib/types";
import { useMemo, useState } from "react";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function inRange(day: Date, start?: string, end?: string) {
  if (!start || !end) return false;
  const t = day.getTime();
  return t > parseISODate(start).getTime() && t < parseISODate(end).getTime();
}

export function isDateBlocked(day: Date, blocked: AvailabilityRange[]) {
  const iso = toISODate(day);
  const t = parseISODate(iso).getTime();
  return blocked.some((range) => {
    const a = parseISODate(range.check_in).getTime();
    const b = parseISODate(range.check_out).getTime();
    return t >= a && t < b;
  });
}

function rangeOverlapsBlocked(start: string, end: string, blocked: AvailabilityRange[]) {
  const a = parseISODate(start).getTime();
  const b = parseISODate(end).getTime();
  return blocked.some((range) => {
    const x = parseISODate(range.check_in).getTime();
    const y = parseISODate(range.check_out).getTime();
    return a < y && b > x;
  });
}

export function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  blocked = [],
  minDate,
}: {
  checkIn?: string;
  checkOut?: string;
  onChange: (checkIn?: string, checkOut?: string) => void;
  blocked?: AvailabilityRange[];
  minDate?: Date;
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(minDate ?? new Date()));
  const months = [cursor, addMonths(cursor, 1)];
  const today = minDate ?? new Date();
  today.setHours(0, 0, 0, 0);

  const handleSelect = (day: Date) => {
    const iso = toISODate(day);
    if (isDateBlocked(day, blocked) || day < today) return;
    if (!checkIn || (checkIn && checkOut)) {
      onChange(iso, undefined);
      return;
    }
    if (iso < checkIn) {
      onChange(iso, undefined);
      return;
    }
    if (rangeOverlapsBlocked(checkIn, iso, blocked)) return;
    onChange(checkIn, iso);
  };

  return (
    <div className="w-[min(820px,100%)] rounded-2xl bg-surface-raised text-text-primary p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-soft"
          onClick={() => setCursor((c) => addMonths(c, -1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-soft"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-2 gap-10">
        {months.map((month) => (
          <MonthGrid
            key={month.toISOString()}
            month={month}
            checkIn={checkIn}
            checkOut={checkOut}
            blocked={blocked}
            today={today}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}

function MonthGrid({
  month,
  checkIn,
  checkOut,
  blocked,
  today,
  onSelect,
}: {
  month: Date;
  checkIn?: string;
  checkOut?: string;
  blocked: AvailabilityRange[];
  today: Date;
  onSelect: (d: Date) => void;
}) {
  const first = startOfMonth(month);
  const blanks = first.getDay();
  const count = daysInMonth(month);
  const title = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const days = useMemo(() => Array.from({ length: count }, (_, i) => i + 1), [count]);

  return (
    <div>
      <div className="mb-4 text-center text-base font-semibold">{title}</div>
      <div className="mb-2 grid grid-cols-7 text-center text-xs text-text-secondary">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={`${d}-${i}`} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: blanks }).map((_, i) => (
          <div key={`b-${i}`} />
        ))}
        {days.map((n) => {
          const day = new Date(month.getFullYear(), month.getMonth(), n);
          const iso = toISODate(day);
          const blockedDay = isDateBlocked(day, blocked) || day < today;
          const start = checkIn && isSameDay(day, parseISODate(checkIn));
          const end = checkOut && isSameDay(day, parseISODate(checkOut));
          const mid = inRange(day, checkIn, checkOut);
          return (
            <button
              type="button"
              key={iso}
              disabled={blockedDay}
              onClick={() => onSelect(day)}
              className={`relative h-10 w-10 justify-self-center text-sm ${
                mid ? "bg-surface-soft" : ""
              } ${start ? "rounded-l-full" : ""} ${end ? "rounded-r-full" : ""}`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  start || end ? "bg-text-primary text-bg font-semibold" : "hover:border hover:border-text-primary"
                } ${blockedDay ? "text-text-disabled line-through opacity-40" : ""}`}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
