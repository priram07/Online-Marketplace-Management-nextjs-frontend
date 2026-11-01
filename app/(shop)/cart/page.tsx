"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import api, { getApiErrorMessage } from "@/lib/api";
import { pushNotification } from "@/lib/notify";
import FormField from "@/components/FormField";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/validations";

export default function CartPage() {
  const { items, removeItem, setQuantity, totalAmount, clear } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema)
  });

  // Axios call #3: POST /customers/:id/orders — creates an order for
  // the logged-in customer. The backend's CreateOrderDto only needs
  // totalAmount, but we still validate the shipping form client-side
  // (Zod) so a customer never submits an unusable delivery address.
  const onSubmit = async (_data: CheckoutFormValues) => {
    if (!user) {
      router.push("/login?next=/cart");
      return;
    }

    setServerError(null);
    try {
      const { data } = await api.post(`/customers/${user.id}/orders`, {
        totalAmount: Number(totalAmount.toFixed(2))
      });
      setPlacedOrderId(data.id);
      const title = "Order placed";
      const body = `Order #${data.id} for $${totalAmount.toFixed(2)} was placed successfully.`;
      // Shows in this tab right away and broadcasts via Pusher so any
      // other open tab/device (customer, seller or admin) hears too.
      await pushNotification(title, body);
      clear();
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Could not place the order. Please try again."));
    }
  };

  if (placedOrderId) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <p className="font-display text-5xl text-moss">✓</p>
        <h1 className="font-display text-2xl text-ink">Order #{placedOrderId} placed</h1>
        <p className="max-w-sm text-sm text-ink/60">
          Thanks for shopping with MarketLoop. You can track this order from your dashboard.
        </p>
        <div className="mt-2 flex gap-3">
          <Link href="/dashboard/orders" className="btn-primary">
            View my orders
          </Link>
          <Link href="/products" className="btn-secondary">
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <p className="font-display text-4xl text-plum/25">Empty</p>
        <h1 className="font-display text-2xl text-ink">Your cart is empty</h1>
        <p className="text-sm text-ink/60">Add a few things from the catalogue to get started.</p>
        <Link href="/products" className="btn-primary">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-3xl text-ink">Your cart</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="card flex items-center gap-4 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-paper-dim font-display text-lg text-plum/40">
                {item.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{item.name}</p>
                <p className="text-xs text-ink/50">${item.price.toFixed(2)} each</p>
              </div>
              <div className="flex items-center rounded-sm border border-line">
                <button
                  className="px-2.5 py-1.5 text-ink/60 hover:text-ink"
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                >
                  −
                </button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <button
                  className="px-2.5 py-1.5 text-ink/60 hover:text-ink"
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <p className="w-16 text-right text-sm font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
              <button
                aria-label={`Remove ${item.name}`}
                onClick={() => removeItem(item.productId)}
                className="text-ink/40 hover:text-rust"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="card h-fit p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="text-sm text-ink/60">Total</span>
            <span className="font-display text-2xl text-ink">${totalAmount.toFixed(2)}</span>
          </div>

          {!user && (
            <p className="mt-4 rounded-sm border border-marigold/40 bg-marigold/10 px-3 py-2 text-xs text-marigold-dark">
              You&apos;ll need to{" "}
              <Link href="/login?next=/cart" className="underline">
                log in
              </Link>{" "}
              before placing an order.
            </p>
          )}

          {serverError && (
            <p role="alert" className="mt-4 text-sm text-rust">
              {serverError}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
            <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
              <input
                id="fullName"
                className={`input ${errors.fullName ? "input-error" : ""}`}
                {...register("fullName")}
              />
            </FormField>
            <FormField label="Delivery address" htmlFor="address" error={errors.address?.message}>
              <input
                id="address"
                className={`input ${errors.address ? "input-error" : ""}`}
                {...register("address")}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="City" htmlFor="city" error={errors.city?.message}>
                <input
                  id="city"
                  className={`input ${errors.city ? "input-error" : ""}`}
                  {...register("city")}
                />
              </FormField>
              <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
                <input
                  id="phone"
                  className={`input ${errors.phone ? "input-error" : ""}`}
                  {...register("phone")}
                />
              </FormField>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? "Placing order..." : "Place order"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
