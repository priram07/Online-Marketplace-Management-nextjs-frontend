"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "@/components/FormField";
import { useAuth } from "@/context/AuthContext";
import { pushNotification } from "@/lib/notify";
import { registerSchema, type RegisterFormValues } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerCustomer } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  // Axios call #2: POST /customers/auth/register (via AuthContext.register).
  // confirmPassword/agreeToTerms are client-only fields and aren't part
  // of RegisterCustomerDto on the backend, so they're stripped here.
  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerCustomer({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined
      });
      const title = "Account created";
      const body = `Welcome to MarketLoop, ${data.fullName}!`;
      // Shows in this tab right away and broadcasts via Pusher so any
      // other open tab/device (customer, seller or admin) hears too.
      await pushNotification(title, body);
      router.push("/login?registered=1");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">Create your account</h1>
        <p className="mt-2 text-sm text-ink/60">Join MarketLoop as a customer.</p>

        {serverError && (
          <p role="alert" className="mt-4 rounded-sm border border-rust/30 bg-rust/5 px-3 py-2 text-sm text-rust">
            {serverError}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
            <input
              id="fullName"
              type="text"
              placeholder="Jane Doe"
              className={`input ${errors.fullName ? "input-error" : ""}`}
              {...register("fullName")}
            />
          </FormField>

          <FormField label="Email address" htmlFor="email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className={`input ${errors.email ? "input-error" : ""}`}
              {...register("email")}
            />
          </FormField>

          <FormField
            label="Phone number (optional)"
            htmlFor="phone"
            error={errors.phone?.message}
          >
            <input
              id="phone"
              type="tel"
              placeholder="+880 1XXXXXXXXX"
              className={`input ${errors.phone ? "input-error" : ""}`}
              {...register("phone")}
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
            hint="At least 6 characters, one uppercase letter, one number."
          >
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className={`input ${errors.password ? "input-error" : ""}`}
              {...register("password")}
            />
          </FormField>

          <FormField
            label="Confirm password"
            htmlFor="confirmPassword"
            error={errors.confirmPassword?.message}
          >
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className={`input ${errors.confirmPassword ? "input-error" : ""}`}
              {...register("confirmPassword")}
            />
          </FormField>

          <label className="flex items-start gap-2 text-sm text-ink/70">
            <input type="checkbox" className="mt-0.5" {...register("agreeToTerms")} />
            <span>I agree to the Terms of Service and Privacy Policy</span>
          </label>
          {errors.agreeToTerms && <p className="field-error">{errors.agreeToTerms.message}</p>}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          Already have an account?{" "}
          <Link href="/login" className="text-plum hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
