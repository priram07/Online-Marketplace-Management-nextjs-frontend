"use client";

import { useEffect, useMemo, useState } from "react";
import api, { getApiErrorMessage } from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import ProductCard from "@/components/shop/ProductCard";
import Spinner from "@/components/Spinner";

// Client-rendered on purpose: the person can filter by category and
// search as they type, and that interactive, per-visitor state is a
// better fit for CSR than a server round-trip on every keystroke.
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        // Two independent Axios GETs, fired in parallel.
        const [productsRes, categoriesRes] = await Promise.all([
          api.get<Product[]>("/products"),
          api.get<Category[]>("/categories")
        ]);
        if (!cancelled) {
          setProducts(productsRes.data);
          setCategories(categoriesRes.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load the catalogue."));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.categoryId === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  return (
    <div className="container-page py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink">Shop the catalogue</h1>
        <p className="mt-2 text-sm text-ink/55">
          {isLoading ? "Loading listings..." : `${filtered.length} of ${products.length} listings`}
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input sm:max-w-xs"
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`badge ${
              selectedCategory === "all" ? "border-plum bg-plum text-white" : "hover:border-ink/40"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`badge ${
                selectedCategory === category.id
                  ? "border-plum bg-plum text-white"
                  : "hover:border-ink/40"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Fetching products..." />
      ) : error ? (
        <div className="card border-rust/30 p-8 text-center text-sm text-rust">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink/55">
          No products match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
