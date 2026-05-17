export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-lg border border-charcoal/10 bg-surface">
        <div className="h-40 animate-shimmer rounded-none" />
        <div className="p-5">
          <div className="-mt-12 h-20 w-20 rounded-full bg-paper ring-4 ring-paper">
            <div className="h-full w-full animate-shimmer rounded-full" />
          </div>
          <div className="mt-4 h-5 w-44 animate-shimmer rounded" />
          <div className="mt-3 h-4 w-full max-w-md animate-shimmer rounded" />
        </div>
      </div>
      <div className="mt-8 grid gap-3">
        <div className="h-28 animate-shimmer rounded-lg border border-charcoal/10" />
        <div className="h-28 animate-shimmer rounded-lg border border-charcoal/10" />
        <div className="h-28 animate-shimmer rounded-lg border border-charcoal/10" />
      </div>
    </main>
  );
}
