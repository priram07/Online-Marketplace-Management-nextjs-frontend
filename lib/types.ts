// Mirrors the shapes returned by the NestJS backend
// (Online-Marketplace-Management). One file for all three portals
// (customer shop, seller hub, admin panel) so every page and component
// agrees on what a Product, Order, Seller, etc. looks like.

import { API_BASE_URL } from "./api";

export type Tag = {
  id: number;
  name: string;
};

export type Category = {
  id: number;
  name: string;
  description?: string | null;
};

export type Product = {
  id: number;
  name: string;
  price: string | number;
  stock: number;
  description?: string | null;
  // Set by the seller hub's product form. Either an absolute URL or a
  // relative path like "/uploads/abc123.jpg" served by the NestJS
  // backend (see resolveImageUrl below), or null/undefined if the
  // seller never added a photo.
  imageUrl?: string | null;
  sellerId?: number | null;
  createdAt: string;
  categoryId: number;
  category?: Category;
  tags?: Tag[];
};

// The backend returns product images as a path like "/uploads/xyz.jpg"
// (relative to the NestJS server, not this Next.js app), so it can't be
// used directly as an <img src>. This resolves it to a full URL,
// leaving already-absolute URLs (http/https) untouched, and returns
// null when there's no image so callers can fall back to a placeholder.
export function resolveImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${API_BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled"
];

export type Order = {
  id: number;
  totalAmount: string | number;
  status: OrderStatus;
  createdAt: string;
  customerId: number;
  // Only present if the backend joins the relation on admin queries.
  customer?: Pick<Customer, "id" | "fullName" | "email">;
};

export type Customer = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  phone?: string;
  address?: string;
  orders?: Order[];
};

// ----- Seller side -----

export type Store = {
  id: number;
  storeName: string;
  description?: string | null;
  logoUrl?: string | null;
};

export type Listing = {
  id: number;
  createdAt?: string;
};

export type Seller = {
  id: number;
  businessName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  store?: Store | null;
  listings?: Listing[];
};

// ----- Helpers -----

export function toNumber(value: string | number): number {
  return typeof value === "number" ? value : parseFloat(value);
}

export function formatCurrency(value: string | number): string {
  return `$${toNumber(value).toFixed(2)}`;
}
