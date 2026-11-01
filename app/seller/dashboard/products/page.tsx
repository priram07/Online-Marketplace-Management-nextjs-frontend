"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sellerApi, getApiErrorMessage } from "@/lib/api";
import { useSellerAuth } from "@/context/SellerAuthContext";
import type { Product } from "@/lib/types";
import { formatCurrency, resolveImageUrl } from "@/lib/types";
import Spinner from "@/components/Spinner";
import { pushNotification } from "@/lib/notify";

export default function ProductsListPage() {
  const { seller: authSeller } = useSellerAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockDrafts, setStockDrafts] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!authSeller) return;
    const sellerId = authSeller.id;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        // Axios call — GET /sellers/:sellerId/products
        const { data } = await sellerApi.get<Product[]>(`/sellers/${sellerId}/products`);
        if (cancelled) return;
        setProducts(data);
        setStockDrafts(Object.fromEntries(data.map((p) => [p.id, String(p.stock)])));
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, "Could not load your products."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authSeller]);

  async function updateStock(productId: number) {
    if (!authSeller) return;
    const raw = stockDrafts[productId];
    const stock = Number(raw);
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock must be a whole number, 0 or more.");
      return;
    }
    setBusyId(productId);
    setError(null);
    try {
      // Axios call — PATCH /sellers/:sellerId/products/:productId/stock
      const { data } = await sellerApi.patch<Product>(
        `/sellers/${authSeller.id}/products/${productId}/stock`,
        { stock }
      );
      setProducts((prev) => prev.map((p) => (p.id === productId ? data : p)));
      pushNotification("Stock updated", `${data.name} now has ${data.stock} in stock.`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update stock."));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteProduct(productId: number, name: string) {
    if (!authSeller) return;
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    setBusyId(productId);
    setError(null);
    try {
      // Axios call — DELETE /sellers/:sellerId/products/:productId
      await sellerApi.delete(`/sellers/${authSeller.id}/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      pushNotification("Product removed", `${name} was removed from your store.`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete this product."));
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) return <Spinner label="Loading your products..." />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Your products</h1>
          <p className="mt-1 text-sm text-ink/55">{products.length} listed</p>
        </div>
        <Link href="/seller/dashboard/products/new" className="btn-primary">
          + New product
        </Link>
      </div>

      {error && <p className="field-error mb-4">{error}</p>}

      {products.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink/55">
          You haven&apos;t listed anything yet.{" "}
          <Link href="/seller/dashboard/products/new" className="text-clay hover:underline">
            Publish your first product
          </Link>
          .
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {products.map((product) => {
            const image = resolveImageUrl(product.imageUrl);
            return (
              <div key={product.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <Link
                  href={`/seller/dashboard/products/${product.id}`}
                  className="flex flex-1 items-center gap-4 min-w-0"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-paper-dim">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display text-lg text-clay/30">
                        {product.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{product.name}</p>
                    <p className="text-sm text-ink/55">{formatCurrency(product.price)}</p>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    className="input w-24"
                    value={stockDrafts[product.id] ?? ""}
                    onChange={(e) =>
                      setStockDrafts((prev) => ({ ...prev, [product.id]: e.target.value }))
                    }
                  />
                  <button
                    className="btn-secondary text-sm"
                    disabled={busyId === product.id}
                    onClick={() => updateStock(product.id)}
                  >
                    Update
                  </button>
                  <button
                    className="btn-danger text-sm"
                    disabled={busyId === product.id}
                    onClick={() => deleteProduct(product.id, product.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
