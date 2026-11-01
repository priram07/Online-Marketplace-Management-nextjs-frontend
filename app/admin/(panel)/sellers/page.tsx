"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { ADMIN_ENDPOINTS, describeAdminError, useAdminData } from "@/lib/admin";
import type { Product, Seller } from "@/lib/types";
import { pushNotification } from "@/lib/notify";
import Spinner from "@/components/Spinner";
import ListToolbar from "@/components/admin/ListToolbar";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmButton from "@/components/admin/ConfirmButton";

type StatusFilter = "all" | "active" | "inactive";

export default function AdminSellersPage() {
  const { data, setData, error, isLoading, reload } = useAdminData<Seller[]>(
    ADMIN_ENDPOINTS.sellers,
    "Could not load sellers."
  );
  // Only used to show "N products" per seller; if it fails the column
  // just shows a dash instead of blocking the page.
  const { data: products } = useAdminData<Product[]>(ADMIN_ENDPOINTS.products, "Could not load products.");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const sellers = useMemo(() => data ?? [], [data]);

  const productCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of products ?? []) {
      if (p.sellerId != null) counts.set(p.sellerId, (counts.get(p.sellerId) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sellers.filter((s) => {
      if (status === "active" && !s.isActive) return false;
      if (status === "inactive" && s.isActive) return false;
      if (!q) return true;
      return (
        s.businessName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.store?.storeName ?? "").toLowerCase().includes(q)
      );
    });
  }, [sellers, search, status]);

  async function toggleActive(seller: Seller) {
    setBusyId(seller.id);
    setActionError(null);
    try {
      // Axios call — PATCH /sellers/:id { isActive }
      const { data: updated } = await adminApi.patch<Partial<Seller>>(
        ADMIN_ENDPOINTS.seller(seller.id),
        { isActive: !seller.isActive }
      );
      const nextActive = typeof updated?.isActive === "boolean" ? updated.isActive : !seller.isActive;
      setData((prev) => (prev ?? []).map((s) => (s.id === seller.id ? { ...s, isActive: nextActive } : s)));
      pushNotification(
        nextActive ? "Seller reactivated" : "Seller deactivated",
        `${seller.businessName} is now ${nextActive ? "active" : "inactive"} on MarketLoop.`
      );
    } catch (err) {
      setActionError(describeAdminError(err, "Could not update this seller."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Sellers</h1>
      <p className="mt-1 text-sm text-ink/55">Oversee business accounts and their storefronts.</p>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search business, email or store"
        summary={`${filtered.length} of ${sellers.length}`}
      >
        <select
          className="input w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </ListToolbar>

      {actionError && <p className="field-error mt-3 text-sm">{actionError}</p>}

      {isLoading ? (
        <Spinner label="Loading sellers..." />
      ) : error ? (
        <div className="card mt-6 border-rust/30 p-6 text-sm text-rust">
          <p>{error}</p>
          <button onClick={reload} className="btn-secondary btn-sm mt-3">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-sm text-ink/55">No sellers match.</div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-3 font-medium">Seller</th>
                <th className="px-3 py-3 font-medium">Store</th>
                <th className="px-3 py-3 font-medium">Products</th>
                <th className="px-3 py-3 font-medium">Joined</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{s.businessName}</p>
                    <p className="text-xs text-ink/50">{s.email}</p>
                  </td>
                  <td className="px-3 py-3 text-ink/60">
                    {s.store?.storeName ? (
                      <Link href={`/seller/store/${s.id}`} className="text-steel hover:underline">
                        {s.store.storeName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 text-ink/60">
                    {products ? (productCounts.get(s.id) ?? 0) : "—"}
                  </td>
                  <td className="px-3 py-3 text-ink/60">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={s.isActive ? "active" : "inactive"} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {s.isActive ? (
                      <ConfirmButton
                        label="Deactivate"
                        confirmLabel="Yes, deactivate"
                        disabled={busyId === s.id}
                        onConfirm={() => toggleActive(s)}
                      />
                    ) : (
                      <button
                        className="btn-secondary btn-sm"
                        disabled={busyId === s.id}
                        onClick={() => toggleActive(s)}
                      >
                        {busyId === s.id ? "Working..." : "Reactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
