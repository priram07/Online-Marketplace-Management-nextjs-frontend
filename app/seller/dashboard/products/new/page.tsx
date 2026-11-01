"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sellerApi, getApiErrorMessage } from "@/lib/api";
import { useSellerAuth } from "@/context/SellerAuthContext";
import { productSchema, type ProductFormValues } from "@/lib/seller-validations";
import type { Category, Product } from "@/lib/types";
import FormField from "@/components/FormField";
import ImageUploader from "@/components/seller/ImageUploader";
import Spinner from "@/components/Spinner";
import { pushNotification } from "@/lib/notify";

export default function NewProductPage() {
  const { seller: authSeller } = useSellerAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { imageUrl: "" }
  });

  const imageUrl = watch("imageUrl");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Axios call — GET /categories
        const { data } = await sellerApi.get<Category[]>("/categories");
        if (cancelled) return;
        setCategories(data);
        if (data.length === 0) {
          setCategoriesError(
            "No categories exist yet. Ask a MarketLoop admin to add one, then refresh this page."
          );
        }
      } catch (err) {
        if (!cancelled) {
          setCategoriesError(getApiErrorMessage(err, "Could not load categories. Refresh to try again."));
        }
      } finally {
        if (!cancelled) setIsLoadingCategories(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(values: ProductFormValues) {
    if (!authSeller) return;
    setFormError(null);
    try {
      const payload = {
        name: values.name,
        price: values.price,
        stock: values.stock,
        categoryId: values.categoryId,
        description: values.description || undefined,
        imageUrl: values.imageUrl || undefined
      };
      // Axios call — POST /sellers/:sellerId/products (writes to the
      // shared products table, so this shows up in the customer app immediately)
      const { data } = await sellerApi.post<Product>(`/sellers/${authSeller.id}/products`, payload);
      pushNotification("New product published", `${data.name} is now live on MarketLoop.`);
      router.push(`/seller/dashboard/products/${data.id}`);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not publish this product."));
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">New product</h1>
      <p className="mt-1 text-sm text-ink/55">
        This publishes straight to the MarketLoop catalogue.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 max-w-xl space-y-5" noValidate>
        <FormField label="Product name" htmlFor="name" error={errors.name?.message}>
          <input
            id="name"
            className={`input ${errors.name ? "input-error" : ""}`}
            placeholder="Hand-thrown ceramic mug"
            {...register("name")}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Price (USD)" htmlFor="price" error={errors.price?.message}>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              className={`input ${errors.price ? "input-error" : ""}`}
              placeholder="24.99"
              {...register("price")}
            />
          </FormField>

          <FormField label="Stock" htmlFor="stock" error={errors.stock?.message}>
            <input
              id="stock"
              type="number"
              min="0"
              className={`input ${errors.stock ? "input-error" : ""}`}
              placeholder="10"
              {...register("stock")}
            />
          </FormField>
        </div>

        <FormField label="Category" htmlFor="categoryId" error={errors.categoryId?.message}>
          <select
            id="categoryId"
            className={`input ${errors.categoryId ? "input-error" : ""}`}
            disabled={isLoadingCategories || categories.length === 0}
            defaultValue=""
            {...register("categoryId")}
          >
            <option value="" disabled>
              {isLoadingCategories ? "Loading categories..." : "Choose a category"}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {!isLoadingCategories && categoriesError && (
            <p className="field-error mt-1">{categoriesError}</p>
          )}
        </FormField>

        <FormField label="Description (optional)" htmlFor="description" error={errors.description?.message}>
          <textarea
            id="description"
            rows={4}
            className={`input ${errors.description ? "input-error" : ""}`}
            placeholder="What makes this product worth buying?"
            {...register("description")}
          />
        </FormField>

        <FormField label="Product photo (optional)" htmlFor="imageUrl">
          <ImageUploader value={imageUrl} onChange={(url) => setValue("imageUrl", url)} />
        </FormField>

        {formError && <p className="field-error">{formError}</p>}

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Publishing..." : "Publish product"}
        </button>
      </form>
    </div>
  );
}
