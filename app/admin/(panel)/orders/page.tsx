"use client";

import { useMemo, useState } from "react";
import { adminApi } from "@/lib/api";
import { ADMIN_ENDPOINTS, describeAdminError, useAdminData } from "@/lib/admin";
import type { Customer, Order, OrderStatus } from "@/lib/types";
import { formatCurrency, ORDER_STATUSES } from "@/lib/types";
import { pushNotification } from "@/lib/notify";
import Spinner from "@/components/Spinner";
import ListToolbar from "@/components/admin/ListToolbar";
import StatusBadge from "@/components/admin/StatusBadge";

export default function AdminOrdersPage() {
  const { data, setData, error, isLoading, reload } = useAdminData<Order[]>(
    ADMIN_ENDPOINTS.orders,
    "Could not load orders."
  );
  // Used to show a customer's name instead of a bare id when the order
  // payload doesn't already embed it.
  const { data: customers } = useAdminData<Customer[]>(ADMIN_ENDPOINTS.customers, "Could not load customers.");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const orders = useMemo(
    () => [...(data ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [data]
  );

  const customerName = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of customers ?? []) map.set(c.id, c.fullName);
    return map;
  }, [customers]);

  const nameFor = (o: Order) => o.customer?.fullName ?? customerName.get(o.customerId) ?? `Customer #${o.customerId}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^#/, "");
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!q) return true;
      return String(o.id) === q || nameFor(o).toLowerCase().includes(q);
    });
    // nameFor closes over customerName/orders, which are in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, search, status, customerName]);

  async function changeStatus(order: Order, next: OrderStatus) {
    if (next === order.status) return;
    setBusyId(order.id);
    setActionError(null);
    try {
      // Axios call — PATCH /orders/:id/status { status }
      const { data: updated } = await adminApi.patch<Partial<Order>>(ADMIN_ENDPOINTS.orderStatus(order.id), {
        status: next
      });
      const applied = (updated?.status as OrderStatus | undefined) ?? next;
      setData((prev) => (prev ?? []).map((o) => (o.id === order.id ? { ...o, status: applied } : o)));
      pushNotification(`Order #${order.id} ${applied}`, `Status changed from ${order.status} to ${applied}.`);
    } catch (err) {
      setActionError(describeAdminError(err, "Could not update this order."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Orders</h1>
      <p className="mt-1 text-sm text-ink/55">Track every order and move it through fulfilment.</p>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order # or customer"
        summary={`${filtered.length} of ${orders.length}`}
      >
        <select
          className="input w-auto capitalize"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </ListToolbar>

      {actionError && <p className="field-error mt-3 text-sm">{actionError}</p>}

      {isLoading ? (
        <Spinner label="Loading orders..." />
      ) : error ? (
        <div className="card mt-6 border-rust/30 p-6 text-sm text-rust">
          <p>{error}</p>
          <button onClick={reload} className="btn-secondary btn-sm mt-3">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-sm text-ink/55">No orders match.</div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Placed</th>
                <th className="px-3 py-3 font-medium">Total</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Update status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-3 font-medium text-ink">#{o.id}</td>
                  <td className="px-3 py-3 text-ink/70">{nameFor(o)}</td>
                  <td className="px-3 py-3 text-ink/60">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-3 text-ink">{formatCurrency(o.totalAmount)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <select
                      className="input w-auto py-1.5 text-xs capitalize"
                      value={o.status}
                      disabled={busyId === o.id}
                      onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                      aria-label={`Update status of order ${o.id}`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
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
