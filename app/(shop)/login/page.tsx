"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "@/components/FormField";
import { useAuth } from "@/context/AuthContext";
import { loginSchema, type LoginFormValues } from "@/lib/validations";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

// useSearchParams() needs a Suspense boundary in the App Router, so the
// actual form lives in this inner component. It reads `next` (where to
// go after logging in) and `registered=1` (came straight from sign up).
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const justRegistered = searchParams.get("registered") === "1";
  const nextPath = searchParams.get("next") || "/dashboard";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  // Axios call #1: POST /customers/auth/login (via AuthContext.login).
  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      await login(data);
      router.push(nextPath);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-ink/60">Log in to continue shopping on MarketLoop.</p>

        {justRegistered && (
          <p className="mt-4 rounded-sm border border-moss/30 bg-moss/5 px-3 py-2 text-sm text-moss">
            Account created. Please log in below.
          </p>
        )}

        {serverError && (
          <p role="alert" className="mt-4 rounded-sm border border-rust/30 bg-rust/5 px-3 py-2 text-sm text-rust">
            {serverError}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <FormField label="Email address" htmlFor="email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className={`input ${errors.email ? "input-error" : ""}`}
              {...register("email")}
            />
          </FormField>

          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className={`input ${errors.password ? "input-error" : ""}`}
              {...register("password")}
            />
          </FormField>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-plum hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
