export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-raised ${className}`} />;
}

export function ListingCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-square rounded-[14px]" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}
