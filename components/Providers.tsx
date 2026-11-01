"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { SellerAuthProvider } from "@/context/SellerAuthContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { CartProvider } from "@/context/CartContext";
import { NotificationProvider } from "@/context/NotificationContext";

// All three portals share one Next.js app, so every provider lives at
// the root. Each auth provider reads its OWN localStorage keys, so a
// customer, a seller and an admin can be signed in side by side.
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SellerAuthProvider>
        <AdminAuthProvider>
          <CartProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </CartProvider>
        </AdminAuthProvider>
      </SellerAuthProvider>
    </AuthProvider>
  );
}
