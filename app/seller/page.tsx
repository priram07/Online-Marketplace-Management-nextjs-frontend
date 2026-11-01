import Link from "next/link";
import { sellerApi } from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import { formatCurrency, resolveImageUrl } from "@/lib/types";

// Render on every request. Without this, `next build` prerenders the page
// once at build time (the fetch below would run while the backend may be
// offline) and the empty result would be frozen into production.
export const dynamic = "force-dynamic";

// Server-rendered on purpose: this is the public marketing/landing
// page, so it benefits from being pre-rendered (fast first paint,
// indexable) and the two lists below change slowly enough that a
// fresh fetch per request is cheap.
async function getHomeData(): Promise<{ categories: Category[]; recentProducts: Product[] }> {
  try {
    // Two Axios GETs, fired in parallel, straight from a server component.
    const [categoriesRes, productsRes] = await Promise.all([
      sellerApi.get<Category[]>("/categories"),
      sellerApi.get<Product[]>("/products")
    ]);
    const recentProducts = [...productsRes.data]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
    return { categories: categoriesRes.data, recentProducts };
  } catch {
    return { categories: [], recentProducts: [] };
  }
}

export default async function HomePage() {
  const { categories, recentProducts } = await getHomeData();

  return (
    <div>
      <section className="border-b border-line bg-paper-dim">
        <div className="container-page grid gap-10 py-20 sm:grid-cols-2 sm:items-center">
          <div>
            <p className="badge border-clay/40 text-clay-dark">For MarketLoop sellers</p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
              Run your store, list products, and watch stock in real time.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/65">
              Seller Hub is the companion app for MarketLoop: register a business
              account, set up your store, publish products with photos, and get
              a live feed of activity the moment something changes.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/seller/register" className="btn-primary">
                Become a seller
              </Link>
              <Link href="/seller/login" className="btn-secondary">
                Log in
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {categories.slice(0, 4).map((category) => (
              <div key={category.id} className="card p-5">
                <p className="text-sm font-medium text-ink">{category.name}</p>
                <p className="mt-1 text-xs text-ink/50">
                  {category.description || "A category buyers browse on MarketLoop."}
                </p>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="col-span-2 text-sm text-ink/50">
                Categories will appear here once the marketplace has some.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-ink">Freshly listed across MarketLoop</h2>
          <span className="text-xs text-ink/45">Live from the catalogue</span>
        </div>

        {recentProducts.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink/55">
            No products listed yet — be the first to publish one.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {recentProducts.map((product) => {
              const image = resolveImageUrl(product.imageUrl);
              return (
                <div key={product.id} className="card overflow-hidden">
                  <div className="flex aspect-square items-center justify-center bg-paper-dim">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display text-4xl text-clay/20">
                        {product.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                    <p className="mt-1 text-sm text-ink/60">{formatCurrency(product.price)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
