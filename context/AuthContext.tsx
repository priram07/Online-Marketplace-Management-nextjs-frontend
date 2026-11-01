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
import api, { TOKEN_KEY, getApiErrorMessage } from "@/lib/api";
import type { LoginFormValues, RegisterFormValues } from "@/lib/validations";

type JwtPayload = {
  sub: number;
  email: string;
  role: string;
  exp: number;
};

type AuthUser = {
  id: number;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  register: (values: Omit<RegisterFormValues, "confirmPassword" | "agreeToTerms">) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const USER_KEY = "marketloop_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first mount, restore the session from localStorage. We decode
  // the JWT purely to read its expiry client-side (never to trust its
  // contents for anything security-sensitive — the backend still
  // verifies it on every protected request).
  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = window.localStorage.getItem(USER_KEY);

    if (token && storedUser) {
      try {
        const payload = jwtDecode<JwtPayload>(token);
        if (payload.exp * 1000 > Date.now()) {
          setUser(JSON.parse(storedUser));
        } else {
          window.localStorage.removeItem(TOKEN_KEY);
          window.localStorage.removeItem(USER_KEY);
        }
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (values: LoginFormValues) => {
    try {
      const { data } = await api.post("/customers/auth/login", values);
      const payload = jwtDecode<JwtPayload>(data.accessToken);
      const nextUser: AuthUser = { id: payload.sub, email: payload.email, role: payload.role };

      window.localStorage.setItem(TOKEN_KEY, data.accessToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Invalid email or password."));
    }
  }, []);

  const register = useCallback(
    async (values: Omit<RegisterFormValues, "confirmPassword" | "agreeToTerms">) => {
      try {
        await api.post("/customers/auth/register", values);
      } catch (error) {
        throw new Error(getApiErrorMessage(error, "Registration failed. Please try again."));
      }
    },
    []
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
