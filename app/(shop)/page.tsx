import Link from "next/link";
import api from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import ProductCard from "@/components/shop/ProductCard";

// Render on every request. Without this, `next build` prerenders the page
// once at build time (the fetch below would run while the backend may be
// offline) and the empty result would be frozen into production.
export const dynamic = "force-dynamic";

// Server component: fetched on the server for every request (SSR),
// which is the right scenario here because the home page is public,
// benefits from being crawlable/SEO-friendly, and its data (product
// catalogue) is cheap to fetch fresh each time.
async function getHomeData() {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      api.get<Product[]>("/products"),
      api.get<Category[]>("/categories")
    ]);
    return { products: productsRes.data, categories: categoriesRes.data };
  } catch {
    // Backend might not be running yet — render an empty state instead
    // of crashing the whole page.
    return { products: [] as Product[], categories: [] as Category[] };
  }
}

export default async function Home() {
  const { products, categories } = await getHomeData();
  const featured = products.slice(0, 8);

  return (
    <div>
      <section className="border-b border-line bg-gradient-to-b from-paper-dim to-paper">
        <div className="container-page grid gap-10 py-20 sm:grid-cols-2 sm:items-center sm:py-28">
          <div>
            <h1 className="font-display text-4xl leading-[1.1] text-ink sm:text-5xl">
              Find things worth buying twice.
            </h1>
            <p className="mt-5 max-w-md text-ink/65">
              MarketLoop gathers listings from independent sellers into one
              place. Browse the catalogue, add what you like, and check out
              in a couple of taps.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">
                Browse the catalogue
              </Link>
              <Link href="/register" className="btn-secondary">
                Create an account
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {categories.slice(0, 4).map((category) => (
              <Link
                key={category.id}
                href={`/products/category/${category.id}`}
                className="card flex h-28 flex-col justify-end bg-white p-4 transition hover:border-plum/50"
              >
                <span className="text-sm font-medium text-ink">{category.name}</span>
                <span className="text-xs text-ink/50">Shop this category</span>
              </Link>
            ))}
            {categories.length === 0 && (
              <p className="col-span-2 text-sm text-ink/50">
                Categories will appear here once the backend has data.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl text-ink">Featured listings</h2>
            <p className="mt-1 text-sm text-ink/55">Freshly fetched from the catalogue.</p>
          </div>
          <Link href="/products" className="text-sm text-plum hover:underline">
            View all products
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink/55">
            No products yet. Once the backend has listings, they&apos;ll show up here.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
