"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { ADMIN_ENDPOINTS, describeAdminError } from "@/lib/admin";
import type { Customer, Order, OrderStatus, Product, Seller } from "@/lib/types";
import { formatCurrency, ORDER_STATUSES, toNumber } from "@/lib/types";
import StatCard from "@/components/StatCard";
import Spinner from "@/components/Spinner";
import StatusBadge from "@/components/admin/StatusBadge";

const LOW_STOCK_THRESHOLD = 5;

type Source<T> = { data: T[]; error: string | null };

type Overview = {
  customers: Source<Customer>;
  sellers: Source<Seller>;
  products: Source<Product>;
  orders: Source<Order>;
};

// Fetches one list, never throws. A missing/forbidden route becomes an
// `error` string so ONE broken endpoint only greys out its own cards.
async function loadList<T>(path: string, label: string): Promise<Source<T>> {
  try {
    const res = await adminApi.get<T[]>(path);
    return { data: Array.isArray(res.data) ? res.data : [], error: null };
  } catch (err) {
    return { data: [], error: `${label}: ${describeAdminError(err, "could not be loaded.")}` };
  }
}

const statusBarColor: Record<OrderStatus, string> = {
  pending: "bg-marigold",
  processing: "bg-plum",
  shipped: "bg-steel",
  delivered: "bg-moss",
  cancelled: "bg-rust"
};

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Four independent Axios GETs fired in parallel.
      const [customers, sellers, products, orders] = await Promise.all([
        loadList<Customer>(ADMIN_ENDPOINTS.customers, "Customers"),
        loadList<Seller>(ADMIN_ENDPOINTS.sellers, "Sellers"),
        loadList<Product>(ADMIN_ENDPOINTS.products, "Products"),
        loadList<Order>(ADMIN_ENDPOINTS.orders, "Orders")
      ]);
      if (!cancelled) setOverview({ customers, sellers, products, orders });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!overview) return <Spinner label="Gathering marketplace stats..." />;

  const { customers, sellers, products, orders } = overview;
  const problems = [customers, sellers, products, orders].map((s) => s.error).filter(Boolean) as string[];

  // "—" when a source failed, so a broken endpoint never shows a
  // misleading 0.
  const count = (src: Source<unknown>, value: number) => (src.error ? "—" : value);

  const activeCustomers = customers.data.filter((c) => c.isActive).length;
  const activeSellers = sellers.data.filter((s) => s.isActive).length;
  const lowStock = products.data
    .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock);
  const revenue = orders.data
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + toNumber(o.totalAmount), 0);
  const byStatus = ORDER_STATUSES.map((status) => ({
    status,
    total: orders.data.filter((o) => o.status === status).length
  }));
  const maxStatus = Math.max(1, ...byStatus.map((b) => b.total));
  const recentOrders = [...orders.data]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Marketplace overview</h1>
      <p className="mt-1 text-sm text-ink/55">A snapshot of everything happening on MarketLoop.</p>

      {problems.length > 0 && (
        <div className="mt-6 rounded-sm border border-marigold/50 bg-marigold/10 p-4 text-sm text-ink/75">
          <p className="font-medium text-ink">Some data couldn&apos;t be loaded</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Customers"
          value={count(customers, customers.data.length)}
          hint={customers.error ? undefined : `${activeCustomers} active`}
        />
        <StatCard
          label="Sellers"
          value={count(sellers, sellers.data.length)}
          hint={sellers.error ? undefined : `${activeSellers} active`}
        />
        <StatCard
          label="Products"
          value={count(products, products.data.length)}
          hint={products.error ? undefined : `${lowStock.length} low on stock`}
        />
        <StatCard
          label="Orders"
          value={count(orders, orders.data.length)}
          hint={orders.error ? undefined : `${formatCurrency(revenue)} revenue`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-display text-lg text-ink">Orders by status</h2>
          {orders.error ? (
            <p className="mt-4 text-sm text-ink/50">Order data isn&apos;t available.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {byStatus.map(({ status, total }) => (
                <div key={status} className="flex items-center gap-3 text-sm">
                  <span className="w-24 capitalize text-ink/65">{status}</span>
                  <div className="h-2 flex-1 rounded-full bg-paper-dim">
                    <div
                      className={`h-2 rounded-full ${statusBarColor[status]}`}
                      style={{ width: `${(total / maxStatus) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums text-ink">{total}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg text-ink">Low stock</h2>
            <Link href="/admin/products" className="text-sm text-steel hover:underline">
              All products
            </Link>
          </div>
          {products.error ? (
            <p className="mt-4 text-sm text-ink/50">Product data isn&apos;t available.</p>
          ) : lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-ink/50">
              Nothing at or below {LOW_STOCK_THRESHOLD} units. Stock levels look healthy.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line text-sm">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <span className="truncate pr-4 text-ink">{p.name}</span>
                  <span className={p.stock === 0 ? "font-medium text-rust" : "text-marigold-dark"}>
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-baseline justify-between px-6 pt-6">
          <h2 className="font-display text-lg text-ink">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-steel hover:underline">
            Manage orders
          </Link>
        </div>
        {orders.error ? (
          <p className="p-6 text-sm text-ink/50">Order data isn&apos;t available.</p>
        ) : recentOrders.length === 0 ? (
          <p className="p-6 text-sm text-ink/50">No orders have been placed yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-2.5 font-medium">Order</th>
                  <th className="px-3 py-2.5 font-medium">Placed</th>
                  <th className="px-3 py-2.5 font-medium">Total</th>
                  <th className="px-6 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-6 py-3 font-medium text-ink">#{o.id}</td>
                    <td className="px-3 py-3 text-ink/60">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-ink">{formatCurrency(o.totalAmount)}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
