import Link from "next/link";
import { notFound } from "next/navigation";
import api from "@/lib/api";
import type { Product } from "@/lib/types";
import { formatCurrency, resolveImageUrl } from "@/lib/types";
import ProductActions from "@/components/shop/ProductActions";

// Dynamic routing: app/products/[id]/page.tsx handles /products/1,
// /products/2, etc. Rendered with SSR — a product page benefits from
// being pre-rendered on the server (fast first paint, shareable,
// indexable), and the data (a single product) is cheap to fetch fresh
// per request.
async function getProduct(id: string): Promise<Product | null> {
  try {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  } catch {
    return null;
  }
}

export default async function ProductDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  // Routing requirement: an id that doesn't exist on the backend
  // renders this route's not-found.tsx instead of a broken page.
  if (!product) {
    notFound();
  }

  const imageSrc = resolveImageUrl(product.imageUrl);

  return (
    <div className="container-page py-12">
      <Link href="/products" className="text-sm text-ink/50 hover:text-plum">
        ← Back to catalogue
      </Link>

      <div className="mt-6 grid gap-10 sm:grid-cols-2">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-sm bg-paper-dim">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-8xl text-plum/20">
              {product.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div>
          {product.category?.name && (
            <Link
              href={`/products/category/${product.categoryId}`}
              className="text-xs uppercase tracking-wide text-moss hover:underline"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 font-display text-3xl text-ink">{product.name}</h1>
          <p className="mt-4 text-2xl font-medium text-ink">{formatCurrency(product.price)}</p>

          <p className="mt-5 max-w-prose text-sm leading-relaxed text-ink/65">
            {product.description || "No description provided for this listing yet."}
          </p>

          {product.tags && product.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag.id} className="badge text-ink/60">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8">
            <ProductActions product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
