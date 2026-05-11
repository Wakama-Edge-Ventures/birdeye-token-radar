interface SkeletonLoaderProps {
  className?: string;
}

export default function SkeletonLoader({ className }: SkeletonLoaderProps) {
  return (
    <div
      aria-hidden="true"
      className={joinClasses(
        "overflow-hidden rounded-2xl bg-slate-900/80",
        className,
      )}
    >
      <div className="h-full w-full animate-pulse bg-[linear-gradient(110deg,rgba(31,41,55,0.9),rgba(55,65,81,0.9),rgba(31,41,55,0.9))] bg-[length:200%_100%]" />
    </div>
  );
}

export function TrendingTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70">
      <div className="grid grid-cols-[72px_minmax(240px,2fr)_1fr_1fr_1fr_180px_120px] gap-4 border-b border-slate-800 px-6 py-4 text-xs uppercase tracking-[0.24em] text-slate-500">
        <span>Rank</span>
        <span>Token</span>
        <span>Price</span>
        <span>24h Change</span>
        <span>Volume</span>
        <span>Safety</span>
        <span>Action</span>
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonLoader
            key={index}
            className="h-16 rounded-2xl border border-slate-800/80"
          />
        ))}
      </div>
    </div>
  );
}

export function NewListingsSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: cards }).map((_, index) => (
        <SkeletonLoader
          key={index}
          className="h-48 rounded-3xl border border-slate-800/80"
        />
      ))}
    </div>
  );
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}
