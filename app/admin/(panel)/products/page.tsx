"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { ADMIN_ENDPOINTS, describeAdminError, useAdminData } from "@/lib/admin";
import type { Category, Product, Seller } from "@/lib/types";
import { formatCurrency, resolveImageUrl } from "@/lib/types";
import { pushNotification } from "@/lib/notify";
import Spinner from "@/components/Spinner";
import ListToolbar from "@/components/admin/ListToolbar";
import ConfirmButton from "@/components/admin/ConfirmButton";

const LOW_STOCK_THRESHOLD = 5;

// Catalogue moderation: every product from every seller, with the
// power to remove listings that break the rules.
export default function AdminProductsPage() {
  const { data, setData, error, isLoading, reload } = useAdminData<Product[]>(
    ADMIN_ENDPOINTS.products,
    "Could not load products."
  );
  // Lookups are nice-to-have: if they fail the table falls back to ids.
  const { data: categories } = useAdminData<Category[]>(ADMIN_ENDPOINTS.categories, "Could not load categories.");
  const { data: sellers } = useAdminData<Seller[]>(ADMIN_ENDPOINTS.sellers, "Could not load sellers.");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | "all">("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const products = useMemo(() => data ?? [], [data]);

  const sellerName = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of sellers ?? []) map.set(s.id, s.businessName);
    return map;
  }, [sellers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryId !== "all" && p.categoryId !== categoryId) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.category?.name ?? "").toLowerCase().includes(q);
    });
  }, [products, search, categoryId]);

  async function removeProduct(product: Product) {
    setBusyId(product.id);
    setActionError(null);
    try {
      // Axios call — DELETE /products/:id
      await adminApi.delete(ADMIN_ENDPOINTS.product(product.id));
      setData((prev) => (prev ?? []).filter((p) => p.id !== product.id));
      pushNotification("Listing removed", `"${product.name}" was removed by an administrator.`);
    } catch (err) {
      setActionError(describeAdminError(err, "Could not remove this product."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Products</h1>
      <p className="mt-1 text-sm text-ink/55">Every listing across all sellers.</p>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products or categories"
        summary={`${filtered.length} of ${products.length}`}
      >
        <select
          className="input w-auto"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value === "all" ? "all" : Number(e.target.value))}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </ListToolbar>

      {actionError && <p className="field-error mt-3 text-sm">{actionError}</p>}

      {isLoading ? (
        <Spinner label="Loading products..." />
      ) : error ? (
        <div className="card mt-6 border-rust/30 p-6 text-sm text-rust">
          <p>{error}</p>
          <button onClick={reload} className="btn-secondary btn-sm mt-3">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-sm text-ink/55">No products match.</div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-3 py-3 font-medium">Seller</th>
                <th className="px-3 py-3 font-medium">Price</th>
                <th className="px-3 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((p) => {
                const image = resolveImageUrl(p.imageUrl);
                const category =
                  p.category?.name ?? (categories ?? []).find((c) => c.id === p.categoryId)?.name;
                return (
                  <tr key={p.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-paper-dim">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-display text-ink/25">{p.name.slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/products/${p.id}`} className="block truncate font-medium text-ink hover:text-steel">
                            {p.name}
                          </Link>
                          <p className="text-xs text-ink/50">{category ?? `Category #${p.categoryId}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-ink/60">
                      {p.sellerId != null ? (sellerName.get(p.sellerId) ?? `Seller #${p.sellerId}`) : "—"}
                    </td>
                    <td className="px-3 py-3 text-ink">{formatCurrency(p.price)}</td>
                    <td
                      className={`px-3 py-3 tabular-nums ${
                        p.stock === 0
                          ? "font-medium text-rust"
                          : p.stock <= LOW_STOCK_THRESHOLD
                            ? "text-marigold-dark"
                            : "text-ink/70"
                      }`}
                    >
                      {p.stock}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ConfirmButton
                        label="Remove"
                        confirmLabel="Yes, remove"
                        disabled={busyId === p.id}
                        onConfirm={() => removeProduct(p)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
