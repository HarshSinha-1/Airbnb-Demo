import { ReviewCard } from "@/components/review/ReviewCard";
import type { Review } from "@/lib/types";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="py-8 text-text-secondary">No reviews yet for this stay.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-x-16 gap-y-10">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
