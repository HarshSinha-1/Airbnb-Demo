"use client";

import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";
import { StarIcon } from "@/components/ui/Icons";

export default function ServicesPage() {
  return (
    <div className="page-gutter pb-24 pt-10">
      <h1 className="text-[32px] font-semibold leading-[38px] mb-10">Services</h1>
      <div className="mx-auto max-w-2xl mt-10">
        <ComingSoonBadge
          icon={<StarIcon className="h-8 w-8 text-text-primary" />}
          label="Services coming soon"
          description="We are working on bringing you exclusive services like private chefs, airport transfers, and spa treatments. Check back later!"
        />
      </div>
    </div>
  );
}
