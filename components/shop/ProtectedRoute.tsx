"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?next=/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <Spinner label="Checking your session..." />;
  }

  return <>{children}</>;
}
