import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const addressSchema = z.object({
  label: z.string().trim().min(1).max(50).default("Home"),
  fullName: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(5).max(30),
  line1: z.string().trim().min(3).max(255),
  line2: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(1).max(100).default("United States"),
  isDefault: z.boolean().optional().default(false),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1, "Your cart is empty"),
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  sameAsBilling: z.boolean().optional().default(false),
  paymentMethod: z.enum(["cash_on_delivery", "card_on_delivery", "bank_transfer"]).default("cash_on_delivery"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(150),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export const productFilterSchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "rating", "popular"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional(),
  featured: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
});

export function formatZodError(error: z.ZodError) {
  const first = error.issues[0];
  return first ? first.message : "Invalid input";
}
