"use client";

import { HeartIcon } from "@/components/ui/Icons";
import { useWishlist } from "@/context/WishlistContext";

export function WishlistButton({ listingId, className = "" }: { listingId: number; className?: string }) {
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(listingId);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(listingId);
      }}
      className={`flex h-8 w-8 items-center justify-center ${className}`}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}
