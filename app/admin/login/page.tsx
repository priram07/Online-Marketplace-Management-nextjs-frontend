"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema, type AdminLoginFormValues } from "@/lib/admin-validations";
import { useAdminAuth } from "@/context/AdminAuthContext";
import FormField from "@/components/FormField";
import { pushNotification } from "@/lib/notify";

export default function AdminLoginPage() {
  const { admin, isLoading, login } = useAdminAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<AdminLoginFormValues>({ resolver: zodResolver(adminLoginSchema) });

  // Already signed in? Skip the form.
  useEffect(() => {
    if (!isLoading && admin) router.replace("/admin");
  }, [isLoading, admin, router]);

  async function onSubmit(values: AdminLoginFormValues) {
    setFormError(null);
    try {
      await login(values);
      pushNotification("Admin signed in", `${values.email} opened the admin panel.`);
      router.push("/admin");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-ink">Admin sign in</h1>
        <p className="mt-1 text-sm text-ink/55">
          Restricted to MarketLoop administrators.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className={`input ${errors.email ? "input-error" : ""}`}
              placeholder="admin@marketloop.com"
              {...register("email")}
            />
          </FormField>

          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={`input ${errors.password ? "input-error" : ""}`}
              placeholder="••••••••"
              {...register("password")}
            />
          </FormField>

          {formError && <p className="field-error">{formError}</p>}

          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
