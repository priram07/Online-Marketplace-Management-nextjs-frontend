import Link from "next/link";
import { notFound } from "next/navigation";
import { sellerApi } from "@/lib/api";
import type { Product, Seller } from "@/lib/types";
import { formatCurrency, resolveImageUrl } from "@/lib/types";

// Dynamic routing: app/store/[id]/page.tsx handles /store/1, /store/2,
// etc. — this is the PUBLIC storefront a seller can share with buyers.
// Rendered with SSR since it's a public, shareable, indexable page and
// the data (one seller + their products) is cheap to fetch per request.
async function getStoreData(id: string): Promise<{ seller: Seller; products: Product[] } | null> {
  try {
    // Axios call — GET /sellers/:id (public; no guard on this route)
    const { data: seller } = await sellerApi.get<Seller>(`/sellers/${id}`);
    // Axios call — GET /products (public catalogue), filtered client-side
    // to this seller's listings since sellerId is a plain column, not
    // a route of its own on the public product API.
    const { data: allProducts } = await sellerApi.get<Product[]>("/products");
    const products = allProducts.filter((p) => p.sellerId === seller.id);
    return { seller, products };
  } catch {
    return null;
  }
}

export default async function PublicStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getStoreData(id);

  // Routing requirement: an id with no matching seller renders this
  // route's not-found.tsx instead of a broken page.
  if (!data) {
    notFound();
  }

  const { seller, products } = data;
  const store = seller.store;

  return (
    <div className="container-page py-12">
      <div className="flex items-start gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-paper-dim">
          {store?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoUrl} alt={store.storeName} className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-3xl text-clay/25">
              {(store?.storeName ?? seller.businessName).slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl text-ink">{store?.storeName ?? seller.businessName}</h1>
          <p className="mt-1 text-sm text-ink/55">{store?.description || "A seller on MarketLoop."}</p>
          {!seller.isActive && (
            <p className="badge mt-2 border-rust/40 text-rust">Currently inactive</p>
          )}
        </div>
      </div>

      <h2 className="mt-10 font-display text-xl text-ink">Products from this store</h2>

      {products.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-sm text-ink/55">
          This store hasn&apos;t listed any products yet.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
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
                  <p className="mt-0.5 text-xs text-ink/45">{product.stock} in stock</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link href="/seller" className="mt-10 inline-block text-sm text-ink/50 hover:text-clay">
        ← Back to Seller Hub
      </Link>
    </div>
  );
}
