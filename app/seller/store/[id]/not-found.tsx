import Link from "next/link";

export default function StoreNotFound() {
  return (
    <div className="container-page flex flex-col items-center gap-4 py-28 text-center">
      <p className="font-display text-6xl text-clay/25">?</p>
      <h1 className="font-display text-2xl text-ink">We couldn&apos;t find that store.</h1>
      <p className="max-w-sm text-sm text-ink/60">
        The seller may not exist, or the link is incorrect.
      </p>
      <Link href="/seller" className="btn-primary">
        Back to Seller Hub
      </Link>
    </div>
  );
}
