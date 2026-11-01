"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import { jwtDecode } from "jwt-decode";
import { adminApi, ADMIN_TOKEN_KEY, ADMIN_KEY } from "@/lib/api";
import { ADMIN_ENDPOINTS, describeAdminError } from "@/lib/admin";
import type { AdminLoginFormValues } from "@/lib/admin-validations";

type JwtPayload = {
  sub: number;
  email: string;
  role: string;
  exp: number;
};

type AuthAdmin = {
  id: number;
  email: string;
  role: string;
};

type AdminAuthContextValue = {
  admin: AuthAdmin | null;
  isLoading: boolean;
  login: (values: AdminLoginFormValues) => Promise<void>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

// Client-side convenience check ONLY. It decides which screen to show;
// the backend must still enforce the admin role on every admin route.
function isAdminRole(role: unknown): boolean {
  return typeof role === "string" && role.toLowerCase() === "admin";
}

function clearSession() {
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_KEY);
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AuthAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session on first mount. The JWT is decoded purely to
  // read its expiry and role client-side.
  useEffect(() => {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    const stored = window.localStorage.getItem(ADMIN_KEY);

    if (token && stored) {
      try {
        const payload = jwtDecode<JwtPayload>(token);
        if (payload.exp * 1000 > Date.now() && isAdminRole(payload.role)) {
          setAdmin(JSON.parse(stored));
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (values: AdminLoginFormValues) => {
    let accessToken: string;
    try {
      const { data } = await adminApi.post(ADMIN_ENDPOINTS.login, values);
      accessToken = data.accessToken;
    } catch (error) {
      throw new Error(describeAdminError(error, "Invalid email or password."));
    }

    const payload = jwtDecode<JwtPayload>(accessToken);
    if (!isAdminRole(payload.role)) {
      // A valid account, but not an admin one — don't keep the token.
      throw new Error("This account doesn't have admin access.");
    }

    const nextAdmin: AuthAdmin = { id: payload.sub, email: payload.email, role: payload.role };
    window.localStorage.setItem(ADMIN_TOKEN_KEY, accessToken);
    window.localStorage.setItem(ADMIN_KEY, JSON.stringify(nextAdmin));
    setAdmin(nextAdmin);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setAdmin(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}
