"use client";

function Row({
  title,
  subtitle,
  value,
  onChange,
  min = 0,
}: {
  title: string;
  subtitle: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  return (
    <div className="flex h-[72px] items-center justify-between border-b border-border-soft last:border-0">
      <div>
        <div className="text-base font-semibold">{title}</div>
        <div className="text-sm text-text-secondary">{subtitle}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong text-lg disabled:opacity-30"
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          aria-label={`Decrease ${title}`}
        >
          −
        </button>
        <span className="w-4 text-center">{value}</span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong text-lg"
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${title}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function GuestPicker({
  adults,
  childrenCount = 0,
  infants,
  pets,
  onChange,
  maxGuests,
}: {
  adults: number;
  childrenCount?: number;
  infants: number;
  pets: number;
  maxGuests?: number;
  onChange: (next: { adults: number; childrenCount: number; infants: number; pets: number }) => void;
}) {
  const children = childrenCount;
  const guests = adults + children;
  const bump = (key: "adults" | "children" | "infants" | "pets", n: number) => {
    const next = { adults, childrenCount: key === "children" ? n : children, infants, pets, [key]: n };
    if (maxGuests && key !== "infants" && key !== "pets") {
      const total = next.adults + next.children;
      if (total > maxGuests) return;
    }
    onChange(next);
  };

  return (
    <div className="w-[400px] max-w-full rounded-2xl bg-white p-6">
      <Row
        title="Adults"
        subtitle="Ages 13 or above"
        value={adults}
        min={1}
        onChange={(n) => bump("adults", n)}
      />
      <Row title="Children" subtitle="Ages 2–12" value={children} onChange={(n) => bump("children", n)} />
      <Row title="Infants" subtitle="Under 2" value={infants} onChange={(n) => bump("infants", n)} />
      <Row
        title="Pets"
        subtitle="Bringing a service animal?"
        value={pets}
        onChange={(n) => bump("pets", n)}
      />
      {maxGuests ? (
        <p className="mt-4 text-sm text-text-secondary">This place has a maximum of {maxGuests} guests, not including infants.</p>
      ) : (
        <p className="mt-4 text-sm text-text-secondary">{guests} guests selected</p>
      )}
    </div>
  );
}
