"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatCurrency, resolveImageUrl } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;
  const imageSrc = resolveImageUrl(product.imageUrl);

  return (
    <Link
      href={`/products/${product.id}`}
      className="card group flex flex-col overflow-hidden transition hover:border-plum/50 hover:shadow-sm"
    >
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-paper-dim">
        {imageSrc ? (
          // Plain <img>, not next/image: product photos come from an
          // arbitrary/self-hosted NestJS backend URL set at runtime via
          // NEXT_PUBLIC_API_URL, so there's no fixed set of domains to
          // pre-configure in next.config.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
            onError={(e) => {
              // Broken/missing file on disk — fall back to the letter
              // placeholder instead of showing a broken-image icon.
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <span className={`font-display text-3xl text-plum/25 ${imageSrc ? "hidden" : ""}`}>
          {product.name.slice(0, 1).toUpperCase()}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.category?.name && (
          <span className="text-xs uppercase tracking-wide text-moss">{product.category.name}</span>
        )}
        <h3 className="font-display text-base leading-snug text-ink group-hover:text-plum">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-medium text-ink">{formatCurrency(product.price)}</span>
          {outOfStock ? (
            <span className="badge border-rust/30 text-rust">Out of stock</span>
          ) : (
            <span className="badge border-moss/30 text-moss">{product.stock} in stock</span>
          )}
        </div>
      </div>
    </Link>
  );
}
