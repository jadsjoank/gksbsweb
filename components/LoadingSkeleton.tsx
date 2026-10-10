export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-3/4 animate-pulse rounded-full bg-gksbs-border" />
      <div className="h-6 w-1/2 animate-pulse rounded-full bg-gksbs-border" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-3xl bg-gksbs-border" />
        <div className="h-48 animate-pulse rounded-3xl bg-gksbs-border" />
      </div>
    </div>
  );
}
