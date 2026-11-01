import { z } from "zod";

// ----- Login form -----
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ----- Registration form -----
// Mirrors RegisterCustomerDto on the backend (fullName, email, password,
// optional phone/address) plus two client-only fields used purely for
// UX (confirmPassword, agreeToTerms) that are stripped out before the
// Axios call in app/register/page.tsx.
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(3, "Full name must be at least 3 characters")
      .max(100, "Full name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    phone: z
      .string()
      .regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the terms" })
    })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// ----- Profile edit form (PATCH /customers/:id) -----
export const profileSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name is too long")
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// ----- Checkout / create-order form -----
// The backend's CreateOrderDto only takes totalAmount + optional status,
// but we still validate the shipping details client-side before placing
// the order so a customer can't check out with an unusable address.
export const checkoutSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  address: z.string().min(5, "Enter a delivery address"),
  city: z.string().min(1, "City is required"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number")
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
