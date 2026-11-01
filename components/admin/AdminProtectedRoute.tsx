"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import Spinner from "@/components/Spinner";

export default function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { admin, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) {
      router.replace("/admin/login");
    }
  }, [isLoading, admin, router]);

  if (isLoading || !admin) {
    return <Spinner label="Checking your session..." />;
  }

  return <>{children}</>;
}
