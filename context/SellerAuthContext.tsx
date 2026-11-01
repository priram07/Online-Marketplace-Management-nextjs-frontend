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
import { sellerApi, SELLER_TOKEN_KEY, SELLER_KEY, getApiErrorMessage } from "@/lib/api";
import type { RegisterFormValues } from "@/lib/seller-validations";
import type { LoginFormValues } from "@/lib/seller-validations";

type JwtPayload = {
  sub: number;
  email: string;
  role: string;
  exp: number;
};

type AuthSeller = {
  id: number;
  email: string;
  role: string;
};

type AuthContextValue = {
  seller: AuthSeller | null;
  isLoading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  register: (values: Omit<RegisterFormValues, "confirmPassword">) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function SellerAuthProvider({ children }: { children: ReactNode }) {
  const [seller, setSeller] = useState<AuthSeller | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first mount, restore the session from localStorage. Decoding
  // the JWT here is only to read its expiry client-side — the backend
  // still verifies the token itself on every protected request (#3
  // onward), this never substitutes for that.
  useEffect(() => {
    const token = window.localStorage.getItem(SELLER_TOKEN_KEY);
    const storedSeller = window.localStorage.getItem(SELLER_KEY);

    if (token && storedSeller) {
      try {
        const payload = jwtDecode<JwtPayload>(token);
        if (payload.exp * 1000 > Date.now()) {
          setSeller(JSON.parse(storedSeller));
        } else {
          window.localStorage.removeItem(SELLER_TOKEN_KEY);
          window.localStorage.removeItem(SELLER_KEY);
        }
      } catch {
        window.localStorage.removeItem(SELLER_TOKEN_KEY);
        window.localStorage.removeItem(SELLER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Axios call #1 — POST /sellers/auth/login
  const login = useCallback(async (values: LoginFormValues) => {
    try {
      const { data } = await sellerApi.post("/sellers/auth/login", values);
      const payload = jwtDecode<JwtPayload>(data.accessToken);
      const nextSeller: AuthSeller = { id: payload.sub, email: payload.email, role: payload.role };

      window.localStorage.setItem(SELLER_TOKEN_KEY, data.accessToken);
      window.localStorage.setItem(SELLER_KEY, JSON.stringify(nextSeller));
      setSeller(nextSeller);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Invalid email or password."));
    }
  }, []);

  // Axios call #2 — POST /sellers/auth/register
  const register = useCallback(async (values: Omit<RegisterFormValues, "confirmPassword">) => {
    try {
      await sellerApi.post("/sellers/auth/register", values);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Registration failed. Please try again."));
    }
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(SELLER_TOKEN_KEY);
    window.localStorage.removeItem(SELLER_KEY);
    setSeller(null);
  }, []);

  return (
    <AuthContext.Provider value={{ seller, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSellerAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useSellerAuth must be used within a SellerAuthProvider");
  return ctx;
}
