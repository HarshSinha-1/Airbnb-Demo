const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const moneyExact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number, exact = false) {
  return (exact ? moneyExact : money).format(value);
}

export function formatRating(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function parseISODate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatShortDate(value: string) {
  return parseISODate(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function formatLongDate(value: string) {
  return parseISODate(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateRange(checkIn?: string, checkOut?: string) {
  if (!checkIn || !checkOut) return null;
  return `${formatShortDate(checkIn)} – ${formatShortDate(checkOut)}`;
}

export function nightsBetween(checkIn: string, checkOut: string) {
  const a = parseISODate(checkIn).getTime();
  const b = parseISODate(checkOut).getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function confirmationCode(id: number) {
  return `HM${id.toString(36).toUpperCase().padStart(4, "0")}`;
}

export function propertyTypeLabel(type: string) {
  return type.replaceAll("_", " ");
}

export function isGuestFavourite(rating: number | null | undefined, count: number) {
  return (rating ?? 0) >= 4.85 && count >= 2;
}
