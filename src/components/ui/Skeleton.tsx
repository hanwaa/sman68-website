import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-line/70", className)} aria-hidden="true" />;
}

export function SkeletonGrid({
  count = 6,
  className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  itemClassName = "h-56",
}: {
  count?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={className} aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat konten...</span>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={itemClassName} />
      ))}
    </div>
  );
}
