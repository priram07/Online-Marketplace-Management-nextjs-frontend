import Link from "next/link";
import { notFound } from "next/navigation";
import api from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import ProductCard from "@/components/shop/ProductCard";

// Second dynamic route in the same section (folder-based + dynamic
// routing): /products/category/[id]. SSR again, for the same reason
// as the product detail page — public, shareable, cheap to refetch.
async function getCategoryProducts(id: string) {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      api.get<Product[]>(`/products/category/${id}`),
      api.get<Category[]>("/categories")
    ]);
    const category = categoriesRes.data.find((c) => c.id === Number(id)) ?? null;
    return { products: productsRes.data, category };
  } catch {
    return { products: [] as Product[], category: null as Category | null };
  }
}

export default async function CategoryProductsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { products, category } = await getCategoryProducts(id);

  if (!category) {
    notFound();
  }

  return (
    <div className="container-page py-12">
      <Link href="/products" className="text-sm text-ink/50 hover:text-plum">
        ← All products
      </Link>

      <h1 className="mt-4 font-display text-3xl text-ink">{category.name}</h1>
      {category.description && <p className="mt-2 text-sm text-ink/55">{category.description}</p>}

      <div className="mt-8">
        {products.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink/55">
            No products in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
