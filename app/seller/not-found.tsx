import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center gap-4 py-32 text-center">
      <p className="font-display text-7xl text-clay/30">404</p>
      <h1 className="font-display text-2xl text-ink">This page wandered off.</h1>
      <p className="max-w-sm text-sm text-ink/60">
        We couldn&apos;t find what you were looking for. It may have moved, or
        the link might be out of date.
      </p>
      <div className="mt-4 flex gap-3">
        <Link href="/seller" className="btn-primary">
          Back to home
        </Link>
        <Link href="/seller/dashboard" className="btn-secondary">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
