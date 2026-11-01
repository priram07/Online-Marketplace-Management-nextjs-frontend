import Link from "next/link";

// Global 404 — shown for any URL that matches no route in any portal.
// (Portal-specific not-found pages handle notFound() thrown inside
// their own segments, e.g. a missing product or store.)
export default function NotFound() {
  return (
    <div className="container-page flex min-h-screen flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="font-display text-7xl text-plum/30">404</p>
      <h1 className="font-display text-2xl text-ink">This page wandered off.</h1>
      <p className="max-w-sm text-sm text-ink/60">
        We couldn&apos;t find what you were looking for. It may have moved, or
        the link might be out of date.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Shop MarketLoop
        </Link>
        <Link href="/seller" className="btn-secondary">
          Seller Hub
        </Link>
      </div>
    </div>
  );
}
