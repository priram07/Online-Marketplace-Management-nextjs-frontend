"use client";

import { useMemo, useState } from "react";
import { adminApi } from "@/lib/api";
import { ADMIN_ENDPOINTS, describeAdminError, useAdminData } from "@/lib/admin";
import type { Customer } from "@/lib/types";
import { pushNotification } from "@/lib/notify";
import Spinner from "@/components/Spinner";
import ListToolbar from "@/components/admin/ListToolbar";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmButton from "@/components/admin/ConfirmButton";

type StatusFilter = "all" | "active" | "inactive";

// Client-rendered: the list is admin-only, changes as admins act on it,
// and is filtered interactively.
export default function AdminCustomersPage() {
  const { data, setData, error, isLoading, reload } = useAdminData<Customer[]>(
    ADMIN_ENDPOINTS.customers,
    "Could not load customers."
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const customers = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (status === "active" && !c.isActive) return false;
      if (status === "inactive" && c.isActive) return false;
      if (!q) return true;
      return c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    });
  }, [customers, search, status]);

  async function toggleActive(customer: Customer) {
    setBusyId(customer.id);
    setActionError(null);
    try {
      // Axios call — PATCH /customers/:id { isActive }
      const { data: updated } = await adminApi.patch<Partial<Customer>>(
        ADMIN_ENDPOINTS.customer(customer.id),
        { isActive: !customer.isActive }
      );
      const nextActive = typeof updated?.isActive === "boolean" ? updated.isActive : !customer.isActive;
      setData((prev) => (prev ?? []).map((c) => (c.id === customer.id ? { ...c, isActive: nextActive } : c)));
      pushNotification(
        nextActive ? "Customer reactivated" : "Customer deactivated",
        `${customer.fullName}'s account is now ${nextActive ? "active" : "inactive"}.`
      );
    } catch (err) {
      setActionError(describeAdminError(err, "Could not update this customer."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Customers</h1>
      <p className="mt-1 text-sm text-ink/55">Review shopper accounts and switch them on or off.</p>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name or email"
        summary={`${filtered.length} of ${customers.length}`}
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
        <Spinner label="Loading customers..." />
      ) : error ? (
        <div className="card mt-6 border-rust/30 p-6 text-sm text-rust">
          <p>{error}</p>
          <button onClick={reload} className="btn-secondary btn-sm mt-3">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-sm text-ink/55">No customers match.</div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Phone</th>
                <th className="px-3 py-3 font-medium">Joined</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{c.fullName}</p>
                    <p className="text-xs text-ink/50">{c.email}</p>
                  </td>
                  <td className="px-3 py-3 text-ink/60">{c.phone || "—"}</td>
                  <td className="px-3 py-3 text-ink/60">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={c.isActive ? "active" : "inactive"} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {c.isActive ? (
                      <ConfirmButton
                        label="Deactivate"
                        confirmLabel="Yes, deactivate"
                        disabled={busyId === c.id}
                        onConfirm={() => toggleActive(c)}
                      />
                    ) : (
                      <button
                        className="btn-secondary btn-sm"
                        disabled={busyId === c.id}
                        onClick={() => toggleActive(c)}
                      >
                        {busyId === c.id ? "Working..." : "Reactivate"}
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
