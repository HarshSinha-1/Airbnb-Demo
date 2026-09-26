import { StarIcon } from "@/components/ui/Icons";
import { formatRating } from "@/lib/format";

export function RatingSummary({
  average,
  count,
}: {
  average: number;
  count: number;
}) {
  const rating = formatRating(average) ?? "New";

  return (
    <section className="border-t border-border-default py-12 text-center">
      <div className="text-[64px] font-bold leading-[70px]">{rating}</div>
      <div className="mt-2 flex justify-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={`star-${i}`} className="h-4 w-4" />
        ))}
      </div>
      {count >= 2 && average >= 4.85 ? (
        <p className="mt-3 text-base font-semibold">Guest favourite</p>
      ) : null}
      <p className="mt-2 text-text-secondary">{count} reviews</p>
    </section>
  );
}
