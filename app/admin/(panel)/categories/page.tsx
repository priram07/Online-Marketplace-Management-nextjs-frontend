"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@/lib/api";
import { ADMIN_ENDPOINTS, describeAdminError, useAdminData } from "@/lib/admin";
import { categorySchema, type CategoryFormValues } from "@/lib/admin-validations";
import type { Category, Product } from "@/lib/types";
import { pushNotification } from "@/lib/notify";
import Spinner from "@/components/Spinner";
import FormField from "@/components/FormField";
import ConfirmButton from "@/components/admin/ConfirmButton";

// Full CRUD for product categories: POST (create), PATCH (edit),
// DELETE (remove). One form serves both create and edit mode.
export default function AdminCategoriesPage() {
  const { data, setData, error, isLoading, reload } = useAdminData<Category[]>(
    ADMIN_ENDPOINTS.categories,
    "Could not load categories."
  );
  // Only to show how many products sit in each category.
  const { data: products } = useAdminData<Product[]>(ADMIN_ENDPOINTS.products, "Could not load products.");

  const [editing, setEditing] = useState<Category | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const categories = useMemo(() => data ?? [], [data]);

  const productCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of products ?? []) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    return counts;
  }, [products]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" }
  });

  // Switch the form between "new" and "edit <category>".
  useEffect(() => {
    reset({ name: editing?.name ?? "", description: editing?.description ?? "" });
  }, [editing, reset]);

  async function onSubmit(values: CategoryFormValues) {
    setFormError(null);
    const payload = { name: values.name, description: values.description || undefined };
    try {
      if (editing) {
        // Axios call — PATCH /categories/:id
        const { data: updated } = await adminApi.patch<Category>(ADMIN_ENDPOINTS.category(editing.id), payload);
        setData((prev) =>
          (prev ?? []).map((c) => (c.id === editing.id ? { ...c, ...payload, ...updated } : c))
        );
        pushNotification("Category updated", `"${values.name}" was updated.`);
        setEditing(null);
      } else {
        // Axios call — POST /categories
        const { data: created } = await adminApi.post<Category>(ADMIN_ENDPOINTS.categories, payload);
        setData((prev) => [...(prev ?? []), created]);
        pushNotification("Category created", `"${values.name}" is now available to sellers.`);
        reset({ name: "", description: "" });
      }
    } catch (err) {
      setFormError(describeAdminError(err, "Could not save this category."));
    }
  }

  async function removeCategory(category: Category) {
    setBusyId(category.id);
    setActionError(null);
    try {
      // Axios call — DELETE /categories/:id
      await adminApi.delete(ADMIN_ENDPOINTS.category(category.id));
      setData((prev) => (prev ?? []).filter((c) => c.id !== category.id));
      if (editing?.id === category.id) setEditing(null);
      pushNotification("Category removed", `"${category.name}" was deleted.`);
    } catch (err) {
      setActionError(
        describeAdminError(err, "Could not delete this category. It may still contain products.")
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Categories</h1>
      <p className="mt-1 text-sm text-ink/55">The shelves sellers file their products under.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card mt-6 grid gap-4 p-6 sm:grid-cols-[1fr_2fr_auto] sm:items-start">
        <FormField label={editing ? "Edit category" : "New category"} htmlFor="name" error={errors.name?.message}>
          <input
            id="name"
            className={`input ${errors.name ? "input-error" : ""}`}
            placeholder="e.g. Home & Kitchen"
            {...register("name")}
          />
        </FormField>
        <FormField label="Description (optional)" htmlFor="description" error={errors.description?.message}>
          <input
            id="description"
            className={`input ${errors.description ? "input-error" : ""}`}
            placeholder="A short line shoppers will see"
            {...register("description")}
          />
        </FormField>
        <div className="flex gap-2 sm:mt-[26px]">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editing ? "Save" : "Add"}
          </button>
          {editing && (
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
          )}
        </div>
        {formError && <p className="field-error sm:col-span-3">{formError}</p>}
      </form>

      {actionError && <p className="field-error mt-3 text-sm">{actionError}</p>}

      {isLoading ? (
        <Spinner label="Loading categories..." />
      ) : error ? (
        <div className="card mt-6 border-rust/30 p-6 text-sm text-rust">
          <p>{error}</p>
          <button onClick={reload} className="btn-secondary btn-sm mt-3">
            Try again
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-sm text-ink/55">
          No categories yet. Add the first one above.
        </div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Description</th>
                <th className="px-3 py-3 font-medium">Products</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {categories.map((c) => (
                <tr key={c.id} className={editing?.id === c.id ? "bg-accent/5" : ""}>
                  <td className="px-5 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-3 py-3 text-ink/60">{c.description || "—"}</td>
                  <td className="px-3 py-3 text-ink/60">{products ? (productCounts.get(c.id) ?? 0) : "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-2">
                      <button className="btn-secondary btn-sm" onClick={() => setEditing(c)}>
                        Edit
                      </button>
                      <ConfirmButton
                        label="Delete"
                        confirmLabel="Yes, delete"
                        disabled={busyId === c.id}
                        onConfirm={() => removeCategory(c)}
                      />
                    </span>
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
