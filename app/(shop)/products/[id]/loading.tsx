export default function ProductLoading() {
  return (
    <div className="container-page py-12">
      <div className="h-4 w-32 animate-pulse rounded bg-line" />
      <div className="mt-6 grid gap-10 sm:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-sm bg-paper-dim" />
        <div className="space-y-4">
          <div className="h-3 w-20 animate-pulse rounded bg-line" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-line" />
          <div className="h-6 w-24 animate-pulse rounded bg-line" />
          <div className="h-20 w-full animate-pulse rounded bg-line" />
          <div className="h-10 w-40 animate-pulse rounded bg-line" />
        </div>
      </div>
    </div>
  );
}
