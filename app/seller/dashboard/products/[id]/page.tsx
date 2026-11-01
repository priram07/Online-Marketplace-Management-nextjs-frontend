"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sellerApi, getApiErrorMessage } from "@/lib/api";
import { useSellerAuth } from "@/context/SellerAuthContext";
import { productSchema, tagSchema, type ProductFormValues, type TagFormValues } from "@/lib/seller-validations";
import type { Category, Product, Tag } from "@/lib/types";
import FormField from "@/components/FormField";
import ImageUploader from "@/components/seller/ImageUploader";
import Spinner from "@/components/Spinner";
import { pushNotification } from "@/lib/notify";

// Dynamic route: app/dashboard/products/[id]/page.tsx handles
// /dashboard/products/1, /dashboard/products/2, etc. Kept client-side
// since editing is an interactive, owner-only workflow with several
// dependent Axios calls (product, categories, tags).
export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const router = useRouter();
  const { seller: authSeller } = useSellerAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const [isSavingTag, setIsSavingTag] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormValues>({ resolver: zodResolver(productSchema) });

  const {
    register: registerTag,
    handleSubmit: handleTagSubmit,
    reset: resetTagForm,
    formState: { errors: tagErrors }
  } = useForm<TagFormValues>({ resolver: zodResolver(tagSchema) });

  const imageUrl = watch("imageUrl");

  useEffect(() => {
    if (!Number.isInteger(productId)) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        // Axios calls fired in parallel — GET /products/:id (public,
        // works whether or not this exact product belongs to the
        // logged-in seller — ownership is enforced by the backend on
        // write), GET /categories, and GET /products/:id/tags
        const [productRes, categoriesRes, tagsRes] = await Promise.all([
          sellerApi.get<Product>(`/products/${productId}`),
          sellerApi.get<Category[]>("/categories"),
          sellerApi.get<Tag[]>(`/products/${productId}/tags`)
        ]);
        if (cancelled) return;
        const product = productRes.data;
        setCategories(categoriesRes.data);
        setTags(tagsRes.data);
        reset({
          name: product.name,
          price: Number(product.price),
          stock: product.stock,
          categoryId: product.categoryId,
          description: product.description || "",
          imageUrl: product.imageUrl || ""
        });
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [productId, reset]);

  async function onSubmit(values: ProductFormValues) {
    if (!authSeller) return;
    setFormError(null);
    setSuccess(false);
    try {
      const payload = {
        name: values.name,
        price: values.price,
        stock: values.stock,
        categoryId: values.categoryId,
        description: values.description || undefined,
        imageUrl: values.imageUrl || undefined
      };
      // Axios call — PUT /sellers/:sellerId/products/:productId
      await sellerApi.put(`/sellers/${authSeller.id}/products/${productId}`, payload);
      setSuccess(true);
      pushNotification("Product updated", `${values.name} was updated.`);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not update this product."));
    }
  }

  async function onAddTag(values: TagFormValues) {
    setIsSavingTag(true);
    setTagError(null);
    try {
      // Axios call — POST /products/:id/tags
      const { data } = await sellerApi.post<Tag>(`/products/${productId}/tags`, values);
      setTags((prev) => (prev.some((t) => t.id === data.id) ? prev : [...prev, data]));
      resetTagForm({ name: "" });
    } catch (err) {
      setTagError(getApiErrorMessage(err, "Could not add that tag."));
    } finally {
      setIsSavingTag(false);
    }
  }

  async function removeTag(tagId: number) {
    setTagError(null);
    try {
      // Axios call — DELETE /products/:id/tags/:tagId
      await sellerApi.delete(`/products/${productId}/tags/${tagId}`);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch (err) {
      setTagError(getApiErrorMessage(err, "Could not remove that tag."));
    }
  }

  if (isLoading) return <Spinner label="Loading product..." />;

  if (notFound) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <p className="font-display text-xl text-ink">We couldn&apos;t find that product.</p>
        <p className="text-sm text-ink/55">It may have been removed already.</p>
        <button onClick={() => router.push("/seller/dashboard/products")} className="btn-primary mt-2">
          Back to your products
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Edit product</h1>
      <p className="mt-1 text-sm text-ink/55">Changes apply to the live MarketLoop catalogue.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 max-w-xl space-y-5" noValidate>
        <FormField label="Product name" htmlFor="name" error={errors.name?.message}>
          <input id="name" className={`input ${errors.name ? "input-error" : ""}`} {...register("name")} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Price (USD)" htmlFor="price" error={errors.price?.message}>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              className={`input ${errors.price ? "input-error" : ""}`}
              {...register("price")}
            />
          </FormField>

          <FormField label="Stock" htmlFor="stock" error={errors.stock?.message}>
            <input
              id="stock"
              type="number"
              min="0"
              className={`input ${errors.stock ? "input-error" : ""}`}
              {...register("stock")}
            />
          </FormField>
        </div>

        <FormField label="Category" htmlFor="categoryId" error={errors.categoryId?.message}>
          <select id="categoryId" className={`input ${errors.categoryId ? "input-error" : ""}`} {...register("categoryId")}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Description" htmlFor="description" error={errors.description?.message}>
          <textarea
            id="description"
            rows={4}
            className={`input ${errors.description ? "input-error" : ""}`}
            {...register("description")}
          />
        </FormField>

        <FormField label="Product photo" htmlFor="imageUrl">
          <ImageUploader value={imageUrl} onChange={(url) => setValue("imageUrl", url)} />
        </FormField>

        {success && <p className="rounded-sm bg-moss/10 px-4 py-2 text-sm text-moss">Saved.</p>}
        {formError && <p className="field-error">{formError}</p>}

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="mt-10 max-w-xl">
        <h2 className="font-display text-lg text-ink">Tags</h2>
        <p className="mt-1 text-sm text-ink/55">Help buyers find this product with searchable tags.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {tags.length === 0 && <p className="text-sm text-ink/45">No tags yet.</p>}
          {tags.map((tag) => (
            <span key={tag.id} className="badge gap-1.5 pr-1.5">
              #{tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="rounded-full px-1 text-ink/40 hover:bg-rust/10 hover:text-rust"
                aria-label={`Remove tag ${tag.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={handleTagSubmit(onAddTag)} className="mt-4 flex items-start gap-2" noValidate>
          <div className="flex-1">
            <input
              className={`input ${tagErrors.name ? "input-error" : ""}`}
              placeholder="e.g. handmade"
              {...registerTag("name")}
            />
            {tagErrors.name && <p className="field-error">{tagErrors.name.message}</p>}
          </div>
          <button type="submit" className="btn-secondary" disabled={isSavingTag}>
            {isSavingTag ? "Adding..." : "Add tag"}
          </button>
        </form>
        {tagError && <p className="field-error">{tagError}</p>}
      </div>
    </div>
  );
}
