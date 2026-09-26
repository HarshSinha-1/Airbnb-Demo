"use client";

import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";
import { StarIcon } from "@/components/ui/Icons";

export default function ComingSoonPage() {
  return (
    <div className="page-gutter pb-24 pt-10">
      <div className="mx-auto max-w-2xl mt-20">
        <ComingSoonBadge
          icon={<StarIcon className="h-8 w-8 text-text-primary" />}
          label="Feature coming soon"
          description="We are working hard to bring this feature to you. Please check back later!"
        />
      </div>
    </div>
  );
}
