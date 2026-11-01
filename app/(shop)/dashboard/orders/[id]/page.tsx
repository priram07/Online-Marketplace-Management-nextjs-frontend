"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api, { getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/types";
import Spinner from "@/components/Spinner";

// Dynamic route nested inside the (already dynamic-routing-covered)
// dashboard section: /dashboard/orders/[id].
export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    // Axios call #8: GET /orders/:id
    api
      .get<Order>(`/orders/${params.id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(getApiErrorMessage(err, "Order not found.")))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handleCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      // Axios call: PATCH /orders/:id/status
      const { data } = await api.patch<Order>(`/orders/${order.id}/status`, {
        status: "cancelled"
      });
      setOrder(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not cancel the order."));
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) return <Spinner label="Loading order..." />;
  if (error) return <p className="text-sm text-rust">{error}</p>;
  if (!order || order.customerId !== user?.id) {
    return <p className="text-sm text-ink/60">This order isn&apos;t on your account.</p>;
  }

  return (
    <div>
      <button onClick={() => router.push("/dashboard/orders")} className="text-sm text-ink/50 hover:text-plum">
        ← Back to orders
      </button>

      <h1 className="mt-4 font-display text-2xl text-ink">Order #{order.id}</h1>
      <p className="mt-1 text-sm text-ink/55">
        Placed on {new Date(order.createdAt).toLocaleString()}
      </p>

      <div className="card mt-6 max-w-md p-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-line/60 pb-2">
            <dt className="text-ink/55">Status</dt>
            <dd className="capitalize text-ink">{order.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/55">Total</dt>
            <dd className="font-medium text-ink">{formatCurrency(order.totalAmount)}</dd>
          </div>
        </dl>

        {order.status === "pending" && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="btn-danger mt-5 w-full"
          >
            {isCancelling ? "Cancelling..." : "Cancel this order"}
          </button>
        )}
      </div>

      <Link href="/products" className="mt-6 inline-block text-sm text-plum hover:underline">
        Continue shopping
      </Link>
    </div>
  );
}
