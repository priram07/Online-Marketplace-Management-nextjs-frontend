import axios, { type AxiosInstance } from "axios";

// Base URL of the NestJS backend. Set NEXT_PUBLIC_API_URL in
// `.env.local` (copy `.env.local.example`). Falls back to the default
// local NestJS port.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ---------------------------------------------------------------------
// Storage keys — one pair per portal. Keeping them separate means a
// customer, a seller and an admin can each be signed in at the same
// time in the same browser without overwriting one another's session.
// ---------------------------------------------------------------------
export const TOKEN_KEY = "marketloop_token";
export const USER_KEY = "marketloop_user";

export const SELLER_TOKEN_KEY = "sellerhub_token";
export const SELLER_KEY = "sellerhub_seller";

export const ADMIN_TOKEN_KEY = "marketloop_admin_token";
export const ADMIN_KEY = "marketloop_admin";

// Builds an Axios instance bound to ONE portal's session. Each instance:
//   1. attaches that portal's JWT (if any) to every outgoing request, and
//   2. clears that portal's session if the backend answers 401.
// It works in both server components (SSR) and client components (CSR)
// because `window`/`localStorage` are only touched inside interceptors,
// which never find a token during server rendering.
function createClient(tokenKey: string, userKey: string): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" }
  });

  instance.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem(tokenKey);
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (
        typeof window !== "undefined" &&
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        window.localStorage.removeItem(tokenKey);
        window.localStorage.removeItem(userKey);
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

// Customer client — also the default export, used by every public
// (SSR) page since those endpoints need no auth.
const api = createClient(TOKEN_KEY, USER_KEY);
export const sellerApi = createClient(SELLER_TOKEN_KEY, SELLER_KEY);
export const adminApi = createClient(ADMIN_TOKEN_KEY, ADMIN_KEY);

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Could not reach the server. Please check your connection and try again.";
    }
    const message = error.response.data?.message;
    return Array.isArray(message) ? message.join(", ") : message || fallback;
  }
  return fallback;
}

export default api;
