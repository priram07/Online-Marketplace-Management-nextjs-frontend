"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sellerApi, getApiErrorMessage } from "@/lib/api";
import { useSellerAuth } from "@/context/SellerAuthContext";
import { storeSchema, type StoreFormValues } from "@/lib/seller-validations";
import type { Store } from "@/lib/types";
import FormField from "@/components/FormField";
import Spinner from "@/components/Spinner";
import { pushNotification } from "@/lib/notify";

// The backend only exposes create (POST) + read (GET) for the
// one-to-one Seller <-> Store relationship, no update route — so once
// a store exists this page becomes read-only, which matches what the
// API actually supports rather than pretending there's an edit flow.
export default function StoreSettingsPage() {
  const { seller: authSeller } = useSellerAuth();
  const [store, setStore] = useState<Store | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<StoreFormValues>({ resolver: zodResolver(storeSchema) });

  useEffect(() => {
    if (!authSeller) return;
    const sellerId = authSeller.id;
    let cancelled = false;

    async function load() {
      try {
        // Axios call — GET /sellers/:id/store
        const { data } = await sellerApi.get<Store>(`/sellers/${sellerId}/store`);
        if (!cancelled) setStore(data);
      } catch {
        if (!cancelled) setStore(null);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authSeller]);

  async function onSubmit(values: StoreFormValues) {
    if (!authSeller) return;
    setFormError(null);
    try {
      const payload = {
        storeName: values.storeName,
        description: values.description || undefined,
        logoUrl: values.logoUrl || undefined
      };
      // Axios call — POST /sellers/:id/store
      const { data } = await sellerApi.post<Store>(`/sellers/${authSeller.id}/store`, payload);
      setStore(data);
      setSuccess(true);
      pushNotification("Store published", `${data.storeName} is now live on MarketLoop.`);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not create your store."));
    }
  }

  if (store === undefined) return <Spinner label="Loading store settings..." />;

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Store settings</h1>
      <p className="mt-1 text-sm text-ink/55">
        This is what buyers see on your public storefront.
      </p>

      {store ? (
        <div className="mt-6 card p-6">
          {success && (
            <p className="mb-4 rounded-sm bg-moss/10 px-4 py-2 text-sm text-moss">
              Store created successfully.
            </p>
          )}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-paper-dim">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logoUrl} alt={store.storeName} className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-2xl text-clay/30">
                  {store.storeName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="font-display text-xl text-ink">{store.storeName}</h2>
              <p className="mt-1 text-sm text-ink/60">{store.description || "No description yet."}</p>
            </div>
          </div>
          <p className="mt-5 text-xs text-ink/45">
            The store name and description can&apos;t be changed from here yet — that&apos;s
            a create-once relationship on the backend. Your{" "}
            <Link href="/seller/dashboard/profile" className="text-clay hover:underline">
              seller profile
            </Link>{" "}
            can still be edited any time.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 max-w-md space-y-5" noValidate>
          <FormField label="Store name" htmlFor="storeName" error={errors.storeName?.message}>
            <input
              id="storeName"
              className={`input ${errors.storeName ? "input-error" : ""}`}
              placeholder="Acme General Store"
              {...register("storeName")}
            />
          </FormField>

          <FormField label="Description (optional)" htmlFor="description" error={errors.description?.message}>
            <textarea
              id="description"
              rows={3}
              className={`input ${errors.description ? "input-error" : ""}`}
              placeholder="What does your store sell?"
              {...register("description")}
            />
          </FormField>

          <FormField
            label="Logo URL (optional)"
            htmlFor="logoUrl"
            error={errors.logoUrl?.message}
            hint="Paste a link to an image, or leave blank for now."
          >
            <input
              id="logoUrl"
              className={`input ${errors.logoUrl ? "input-error" : ""}`}
              placeholder="https://..."
              {...register("logoUrl")}
            />
          </FormField>

          {formError && <p className="field-error">{formError}</p>}

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating store..." : "Create store"}
          </button>
        </form>
      )}
    </div>
  );
}
