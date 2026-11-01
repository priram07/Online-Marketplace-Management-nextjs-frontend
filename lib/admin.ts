import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { adminApi, getApiErrorMessage } from "@/lib/api";

// ---------------------------------------------------------------------
// Every backend route the admin panel touches, in ONE place.
//
// If your NestJS backend names a route differently, change it here and
// nothing else. See README.md → "Backend contract for the admin panel"
// for which of these already exist and which need adding.
// ---------------------------------------------------------------------
export const ADMIN_ENDPOINTS = {
  // POST { email, password } -> { accessToken }. The JWT payload must
  // carry role: "admin". Override with NEXT_PUBLIC_ADMIN_LOGIN_PATH.
  login: process.env.NEXT_PUBLIC_ADMIN_LOGIN_PATH || "/admin/auth/login",

  customers: "/customers", // GET list
  customer: (id: number) => `/customers/${id}`, // PATCH { isActive }

  sellers: "/sellers", // GET list
  seller: (id: number) => `/sellers/${id}`, // PATCH { isActive }

  products: "/products", // GET list
  product: (id: number) => `/products/${id}`, // DELETE (moderation)

  orders: "/orders", // GET list
  orderStatus: (id: number) => `/orders/${id}/status`, // PATCH { status }

  categories: "/categories", // GET list, POST { name, description }
  category: (id: number) => `/categories/${id}` // PATCH { name, description }, DELETE
} as const;

// Turns an Axios failure into something an admin can act on. Missing
// routes (404/405) and permission problems (403) are the two things
// most likely to go wrong while wiring the panel to a backend, so they
// get explicit, specific messages instead of a generic "failed".
export function describeAdminError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response) {
    const { status } = error.response;
    const method = error.config?.method?.toUpperCase() ?? "";
    const url = error.config?.url ?? "";
    if (status === 404 || status === 405) {
      // A 404 can also mean "that record doesn't exist", so only blame
      // the route when the backend sent no explanatory message of its own.
      const own = error.response.data?.message;
      if (!own || /cannot (get|post|put|patch|delete)/i.test(String(own))) {
        return `The backend doesn't expose ${method} ${url} yet. See README → "Backend contract for the admin panel".`;
      }
    }
    if (status === 403) {
      return "Your admin account isn't permitted to do this. Check the role guard on that backend route.";
    }
  }
  return getApiErrorMessage(error, fallback);
}

type AdminData<T> = {
  data: T | null;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  error: string | null;
  isLoading: boolean;
  reload: () => Promise<void>;
};

// Minimal GET-and-hold hook for admin pages. `path` may be null to
// defer loading.
export function useAdminData<T>(path: string | null, fallback: string): AdminData<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(path));

  const load = useCallback(async () => {
    if (!path) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.get<T>(path);
      setData(res.data);
    } catch (err) {
      setError(describeAdminError(err, fallback));
    } finally {
      setIsLoading(false);
    }
  }, [path, fallback]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, error, isLoading, reload: load };
}
