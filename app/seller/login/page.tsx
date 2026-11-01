"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/seller-validations";
import { useSellerAuth } from "@/context/SellerAuthContext";
import FormField from "@/components/FormField";
import { pushNotification } from "@/lib/notify";

export default function LoginPage() {
  const { login } = useSellerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values);
      pushNotification("Welcome back", `${values.email} signed in to Seller Hub.`);
      router.push(searchParams.get("next") || "/seller/dashboard");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-ink">Log in to Seller Hub</h1>
        <p className="mt-1 text-sm text-ink/55">Manage your store and listings.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? "input-error" : ""}`}
              placeholder="you@business.com"
              {...register("email")}
            />
          </FormField>

          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <input
              id="password"
              type="password"
              className={`input ${errors.password ? "input-error" : ""}`}
              placeholder="••••••••"
              {...register("password")}
            />
          </FormField>

          {formError && <p className="field-error">{formError}</p>}

          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/55">
          New to Seller Hub?{" "}
          <Link href="/seller/register" className="font-medium text-clay hover:underline">
            Create a seller account
          </Link>
        </p>
      </div>
    </div>
  );
}
