"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sellerApi, getApiErrorMessage } from "@/lib/api";
import { useSellerAuth } from "@/context/SellerAuthContext";
import type { Product, Seller, Store } from "@/lib/types";
import { formatCurrency } from "@/lib/types";
import StatCard from "@/components/StatCard";
import Spinner from "@/components/Spinner";

// Client-rendered: this page is only ever seen after logging in, and
// shows this particular seller's own, frequently-changing data, so
// there is no SEO/first-paint benefit to SSR here.
export default function DashboardOverviewPage() {
  const { seller: authSeller } = useSellerAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authSeller) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        // Axios call — GET /sellers/me
        const meRes = await sellerApi.get<Seller>("/sellers/me");
        if (cancelled) return;
        setSeller(meRes.data);

        // Axios calls fired in parallel — GET /sellers/:id/store and
        // GET /sellers/:sellerId/products. The store call is expected
        // to 404 for a brand-new seller, so it's handled separately.
        const [storeResult, productsRes] = await Promise.all([
          sellerApi.get<Store>(`/sellers/${meRes.data.id}/store`).catch(() => null),
          sellerApi.get<Product[]>(`/sellers/${meRes.data.id}/products`)
        ]);
        if (cancelled) return;
        setStore(storeResult?.data ?? null);
        setProducts(productsRes.data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, "Could not load your dashboard."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authSeller]);

  if (isLoading) return <Spinner label="Fetching your store..." />;
  if (error) return <div className="card border-rust/30 p-8 text-sm text-rust">{error}</div>;

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + p.stock * Number(p.price), 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">
        Welcome back{seller ? `, ${seller.businessName}` : ""}
      </h1>
      <p className="mt-1 text-sm text-ink/55">Here&apos;s how your store is doing.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Products listed" value={products.length} />
        <StatCard label="Units in stock" value={totalStock} />
        <StatCard label="Inventory value" value={formatCurrency(totalValue)} />
      </div>

      <div className="mt-8 card p-6">
        {store ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-ink/45">Your store</p>
            <h2 className="mt-1 font-display text-xl text-ink">{store.storeName}</h2>
            <p className="mt-1 text-sm text-ink/60">{store.description || "No description yet."}</p>
            <Link href="/seller/dashboard/store" className="mt-3 inline-block text-sm text-clay hover:underline">
              View store settings →
            </Link>
          </div>
        ) : (
          <div>
            <p className="font-medium text-ink">You haven&apos;t set up a store yet.</p>
            <p className="mt-1 text-sm text-ink/55">
              Buyers see your store name and description on your public storefront.
            </p>
            <Link href="/seller/dashboard/store" className="btn-primary mt-4 inline-flex">
              Set up your store
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Recent products</h2>
          <Link href="/seller/dashboard/products" className="text-sm text-clay hover:underline">
            View all
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ink/55">
            You haven&apos;t listed anything yet.{" "}
            <Link href="/seller/dashboard/products/new" className="text-clay hover:underline">
              Publish your first product
            </Link>
            .
          </div>
        ) : (
          <div className="card divide-y divide-line">
            {products.slice(0, 5).map((product) => (
              <Link
                key={product.id}
                href={`/seller/dashboard/products/${product.id}`}
                className="flex items-center justify-between px-5 py-4 text-sm hover:bg-ink/5"
              >
                <span className="font-medium text-ink">{product.name}</span>
                <span className="text-ink/55">
                  {formatCurrency(product.price)} · {product.stock} in stock
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
