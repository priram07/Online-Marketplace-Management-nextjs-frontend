import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="container-page flex flex-col items-center gap-4 py-28 text-center">
      <p className="font-display text-6xl text-plum/25">?</p>
      <h1 className="font-display text-2xl text-ink">We couldn&apos;t find that listing.</h1>
      <p className="max-w-sm text-sm text-ink/60">
        The product may have been removed or the link is incorrect.
      </p>
      <Link href="/products" className="btn-primary">
        Browse the catalogue
      </Link>
    </div>
  );
}
