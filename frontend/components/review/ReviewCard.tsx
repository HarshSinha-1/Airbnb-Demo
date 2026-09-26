import { formatLongDate } from "@/lib/format";
import type { Review } from "@/lib/types";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <article>
      <div className="mb-3 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={review.author.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
        <div>
          <div className="text-base font-semibold">{review.author.name}</div>
          <div className="text-sm text-text-secondary">{formatLongDate(review.created_at.slice(0, 10))}</div>
        </div>
      </div>
      <p className="text-base leading-6 text-text-body">{review.comment}</p>
    </article>
  );
}
