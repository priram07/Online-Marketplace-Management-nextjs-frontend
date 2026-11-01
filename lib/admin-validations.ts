import { z } from "zod";

// ----- Admin login (POST ADMIN_ENDPOINTS.login) -----
export const adminLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

// ----- Category form (POST/PATCH /categories) -----
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long"),
  description: z.string().max(255, "Keep it under 255 characters").optional().or(z.literal(""))
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
