export default function StoreLoading() {
  return (
    <div className="container-page py-12">
      <div className="flex items-start gap-5">
        <div className="h-20 w-20 animate-pulse rounded-sm bg-paper-dim" />
        <div className="space-y-3">
          <div className="h-8 w-56 animate-pulse rounded bg-line" />
          <div className="h-4 w-72 animate-pulse rounded bg-line" />
        </div>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-sm bg-paper-dim" />
        ))}
      </div>
    </div>
  );
}
