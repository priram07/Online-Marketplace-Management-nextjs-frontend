import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="font-display text-6xl text-clay/25">?</p>
      <h1 className="font-display text-xl text-ink">We couldn&apos;t find that product.</h1>
      <Link href="/seller/dashboard/products" className="btn-primary">
        Back to your products
      </Link>
    </div>
  );
}
