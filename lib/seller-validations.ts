import { z } from "zod";

// ----- Login form (POST /sellers/auth/login) -----
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ----- Registration form (POST /sellers/auth/register) -----
// Mirrors RegisterSellerDto (businessName, email, password, optional
// storeName/description) plus a client-only confirmPassword field
// used purely for UX, stripped out before the Axios call.
export const registerSchema = z
  .object({
    businessName: z
      .string()
      .min(1, "Business name is required")
      .min(2, "Business name must be at least 2 characters")
      .max(100, "Business name is too long"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    storeName: z.string().max(120, "Store name is too long").optional().or(z.literal("")),
    description: z.string().max(500, "Keep it under 500 characters").optional().or(z.literal(""))
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// ----- Profile edit form (PUT /sellers/:id) -----
// Mirrors UpdateSellerDto = RegisterSellerDto without password.
export const profileSchema = z.object({
  businessName: z
    .string()
    .min(1, "Business name is required")
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name is too long"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  storeName: z.string().max(120, "Store name is too long").optional().or(z.literal("")),
  description: z.string().max(500, "Keep it under 500 characters").optional().or(z.literal(""))
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// ----- Store settings form (POST /sellers/:id/store) -----
export const storeSchema = z.object({
  storeName: z
    .string()
    .min(1, "Store name is required")
    .min(2, "Store name must be at least 2 characters")
    .max(120, "Store name is too long"),
  description: z.string().max(500, "Keep it under 500 characters").optional().or(z.literal("")),
  logoUrl: z.string().url("Enter a valid URL").optional().or(z.literal(""))
});

export type StoreFormValues = z.infer<typeof storeSchema>;

// ----- Product form (POST/PUT /sellers/:sellerId/products) -----
// Mirrors CreateProductDto exactly, including its numeric constraints,
// so invalid submissions are caught client-side before the round trip.
export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .min(2, "Name must be at least 2 characters")
    .max(150, "Name is too long"),
  price: z.coerce.number({ invalid_type_error: "Enter a price" }).positive("Price must be greater than 0"),
  stock: z.coerce
    .number({ invalid_type_error: "Enter a stock quantity" })
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  description: z.string().max(2000, "Keep it under 2000 characters").optional().or(z.literal("")),
  categoryId: z.coerce.number({ invalid_type_error: "Choose a category" }).int().positive("Choose a category"),
  imageUrl: z.string().optional().or(z.literal(""))
});

export type ProductFormValues = z.infer<typeof productSchema>;

// ----- Quick stock update (PATCH /sellers/:sellerId/products/:id/stock) -----
export const stockSchema = z.object({
  stock: z.coerce
    .number({ invalid_type_error: "Enter a stock quantity" })
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
});

export type StockFormValues = z.infer<typeof stockSchema>;

// ----- Tag form (POST /products/:id/tags) -----
export const tagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name is too long")
    .regex(/^[a-zA-Z0-9\- ]+$/, "Letters, numbers, spaces and dashes only")
});

export type TagFormValues = z.infer<typeof tagSchema>;
