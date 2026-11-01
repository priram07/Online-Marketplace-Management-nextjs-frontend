"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSellerAuth } from "@/context/SellerAuthContext";
import Spinner from "@/components/Spinner";

export default function SellerProtectedRoute({ children }: { children: ReactNode }) {
  const { seller, isLoading } = useSellerAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !seller) {
      router.replace("/seller/login?next=/seller/dashboard");
    }
  }, [isLoading, seller, router]);

  if (isLoading || !seller) {
    return <Spinner label="Checking your session..." />;
  }

  return <>{children}</>;
}
