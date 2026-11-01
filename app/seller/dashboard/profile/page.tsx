"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sellerApi, getApiErrorMessage } from "@/lib/api";
import { useSellerAuth } from "@/context/SellerAuthContext";
import { profileSchema, type ProfileFormValues } from "@/lib/seller-validations";
import type { Seller } from "@/lib/types";
import FormField from "@/components/FormField";
import Spinner from "@/components/Spinner";
import { pushNotification } from "@/lib/notify";

export default function ProfilePage() {
  const { seller: authSeller } = useSellerAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (!authSeller) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        // Axios call — GET /sellers/me
        const { data } = await sellerApi.get<Seller>("/sellers/me");
        if (cancelled) return;
        setSeller(data);
        reset({ businessName: data.businessName, email: data.email, storeName: "", description: "" });
      } catch (err) {
        if (!cancelled) setLoadError(getApiErrorMessage(err, "Could not load your profile."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authSeller, reset]);

  async function onSubmit(values: ProfileFormValues) {
    if (!seller) return;
    setFormError(null);
    setSuccess(false);
    try {
      const payload = {
        businessName: values.businessName,
        email: values.email,
        storeName: values.storeName || undefined,
        description: values.description || undefined
      };
      // Axios call — PUT /sellers/:id (full update)
      const { data } = await sellerApi.put<Seller>(`/sellers/${seller.id}`, payload);
      setSeller(data);
      setSuccess(true);
      pushNotification("Profile updated", `${data.businessName}'s profile was updated.`);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not update your profile."));
    }
  }

  async function toggleActive() {
    if (!seller) return;
    setIsTogglingActive(true);
    try {
      // Axios call — PATCH /sellers/:id (partial update)
      const { data } = await sellerApi.patch<Seller>(`/sellers/${seller.id}`, {
        isActive: !seller.isActive
      });
      setSeller(data);
      pushNotification(
        data.isActive ? "Account reactivated" : "Account deactivated",
        `${data.businessName}'s account is now ${data.isActive ? "active" : "inactive"}.`
      );
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not update your account status."));
    } finally {
      setIsTogglingActive(false);
    }
  }

  if (isLoading) return <Spinner label="Loading your profile..." />;
  if (loadError) return <div className="card border-rust/30 p-8 text-sm text-rust">{loadError}</div>;

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Your profile</h1>
      <p className="mt-1 text-sm text-ink/55">Update your business details.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 max-w-md space-y-5" noValidate>
        <FormField label="Business name" htmlFor="businessName" error={errors.businessName?.message}>
          <input
            id="businessName"
            className={`input ${errors.businessName ? "input-error" : ""}`}
            {...register("businessName")}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            className={`input ${errors.email ? "input-error" : ""}`}
            {...register("email")}
          />
        </FormField>

        {success && (
          <p className="rounded-sm bg-moss/10 px-4 py-2 text-sm text-moss">Profile updated.</p>
        )}
        {formError && <p className="field-error">{formError}</p>}

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
      </form>

      {seller && (
        <div className="mt-10 max-w-md card p-5">
          <p className="text-sm font-medium text-ink">Account status</p>
          <p className="mt-1 text-sm text-ink/60">
            Your account is currently{" "}
            <span className={seller.isActive ? "text-moss" : "text-rust"}>
              {seller.isActive ? "active" : "inactive"}
            </span>
            . Deactivating hides your store from buyers without deleting your data.
          </p>
          <button
            onClick={toggleActive}
            disabled={isTogglingActive}
            className={seller.isActive ? "btn-danger mt-4" : "btn-secondary mt-4"}
          >
            {isTogglingActive
              ? "Updating..."
              : seller.isActive
                ? "Deactivate account"
                : "Reactivate account"}
          </button>
        </div>
      )}
    </div>
  );
}
