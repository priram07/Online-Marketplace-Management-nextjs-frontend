"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api, { getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/types";
import Spinner from "@/components/Spinner";

const statusStyles: Record<string, string> = {
  pending: "border-marigold/40 text-marigold-dark",
  processing: "border-plum/30 text-plum",
  shipped: "border-moss/30 text-moss",
  delivered: "border-moss/30 text-moss",
  cancelled: "border-rust/30 text-rust"
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Axios call #7: GET /customers/:id/orders
    api
      .get<Order[]>(`/customers/${user.id}/orders`)
      .then((res) => setOrders(res.data))
      .catch((err) => setError(getApiErrorMessage(err, "Could not load your orders.")))
      .finally(() => setIsLoading(false));
  }, [user]);

  if (isLoading) return <Spinner label="Loading your orders..." />;
  if (error) return <p className="text-sm text-rust">{error}</p>;

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Your orders</h1>
      <p className="mt-1 text-sm text-ink/55">{orders.length} order(s) placed so far.</p>

      {orders.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-sm text-ink/55">
          No orders yet.{" "}
          <Link href="/products" className="text-plum hover:underline">
            Start shopping
          </Link>
          .
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/orders/${order.id}`}
              className="card flex items-center justify-between p-4 transition hover:border-plum/50"
            >
              <div>
                <p className="text-sm font-medium text-ink">Order #{order.id}</p>
                <p className="text-xs text-ink/50">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-ink">
                  {formatCurrency(order.totalAmount)}
                </span>
                <span className={`badge ${statusStyles[order.status] ?? ""}`}>{order.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
