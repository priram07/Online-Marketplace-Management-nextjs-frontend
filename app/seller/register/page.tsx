"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormValues } from "@/lib/seller-validations";
import { useSellerAuth } from "@/context/SellerAuthContext";
import FormField from "@/components/FormField";
import { pushNotification } from "@/lib/notify";

export default function RegisterPage() {
  const { register: registerSeller } = useSellerAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    try {
      const { confirmPassword, ...payload } = values;
      const cleaned = {
        ...payload,
        storeName: payload.storeName || undefined,
        description: payload.description || undefined
      };
      await registerSeller(cleaned);
      pushNotification("New seller registered", `${values.businessName} joined MarketLoop.`);
      setSuccess(true);
      setTimeout(() => router.push("/seller/login"), 1200);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-ink">Become a seller</h1>
        <p className="mt-1 text-sm text-ink/55">Set up your business account on MarketLoop.</p>

        {success ? (
          <div className="mt-8 card border-moss/30 p-6 text-center text-sm text-moss">
            Account created! Redirecting you to log in...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <FormField label="Business name" htmlFor="businessName" error={errors.businessName?.message}>
              <input
                id="businessName"
                className={`input ${errors.businessName ? "input-error" : ""}`}
                placeholder="Acme Goods Co."
                {...register("businessName")}
              />
            </FormField>

            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <input
                id="email"
                type="email"
                className={`input ${errors.email ? "input-error" : ""}`}
                placeholder="you@business.com"
                {...register("email")}
              />
            </FormField>

            <FormField
              label="Password"
              htmlFor="password"
              error={errors.password?.message}
              hint="At least 6 characters, one uppercase letter and one number."
            >
              <input
                id="password"
                type="password"
                className={`input ${errors.password ? "input-error" : ""}`}
                placeholder="••••••••"
                {...register("password")}
              />
            </FormField>

            <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
              <input
                id="confirmPassword"
                type="password"
                className={`input ${errors.confirmPassword ? "input-error" : ""}`}
                placeholder="••••••••"
                {...register("confirmPassword")}
              />
            </FormField>

            <FormField
              label="Store name (optional)"
              htmlFor="storeName"
              error={errors.storeName?.message}
              hint="You can also set this up later from the dashboard."
            >
              <input
                id="storeName"
                className={`input ${errors.storeName ? "input-error" : ""}`}
                placeholder="Acme General Store"
                {...register("storeName")}
              />
            </FormField>

            <FormField label="Store description (optional)" htmlFor="description" error={errors.description?.message}>
              <textarea
                id="description"
                rows={3}
                className={`input ${errors.description ? "input-error" : ""}`}
                placeholder="What does your store sell?"
                {...register("description")}
              />
            </FormField>

            {formError && <p className="field-error">{formError}</p>}

            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create seller account"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink/55">
          Already selling on MarketLoop?{" "}
          <Link href="/seller/login" className="font-medium text-clay hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
