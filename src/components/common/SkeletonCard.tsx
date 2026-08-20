export function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`wi-card ${className}`}><div className="skeleton-shimmer h-4 w-3/4 rounded mb-3" /><div className="skeleton-shimmer h-8 w-1/2 rounded mb-3" /><div className="skeleton-shimmer h-4 w-full rounded" /></div>;
}

export function SkeletonHeroCard() {
  return (
    <div className="wi-card p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1 space-y-3">
          <div className="skeleton-shimmer h-5 w-40 rounded" />
          <div className="skeleton-shimmer h-16 w-32 rounded" />
          <div className="skeleton-shimmer h-4 w-48 rounded" />
          <div className="skeleton-shimmer h-4 w-36 rounded" />
          <div className="flex gap-6 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="skeleton-shimmer h-3 w-16 rounded" />
                <div className="skeleton-shimmer h-5 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="skeleton-shimmer h-24 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonHourly() {
  return (
    <div className="wi-card">
      <div className="skeleton-shimmer h-4 w-32 rounded mb-4" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-16 text-center space-y-2">
            <div className="skeleton-shimmer h-3 w-10 mx-auto rounded" />
            <div className="skeleton-shimmer h-6 w-6 mx-auto rounded-full" />
            <div className="skeleton-shimmer h-4 w-8 mx-auto rounded" />
            <div className="skeleton-shimmer h-3 w-10 mx-auto rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDaily() {
  return (
    <div className="wi-card">
      <div className="skeleton-shimmer h-4 w-32 rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="skeleton-shimmer h-4 w-24 rounded" />
            <div className="flex items-center gap-3">
              <div className="skeleton-shimmer h-5 w-5 rounded" />
              <div className="skeleton-shimmer h-4 w-28 rounded" />
              <div className="skeleton-shimmer h-4 w-16 rounded" />
              <div className="skeleton-shimmer h-4 w-14 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
