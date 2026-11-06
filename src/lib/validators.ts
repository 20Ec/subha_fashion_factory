import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(72, "Password is too long");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const addressSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
  line1: z.string().trim().min(5, "Address line 1 is required"),
  line2: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]{4,10}$/, "Enter a valid pincode"),
  landmark: z.string().trim().max(120).optional().default(""),
  is_default: z.boolean().optional().default(false),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name is required"),
  description: z.string().trim().max(500).optional().default(""),
  image_url: z.string().trim().url("Enter a valid image URL").optional().or(z.literal("")),
  image_public_id: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).optional().default(0),
});

export const productOptionSchema = z.object({
  id: z.string().uuid().optional(),
  pricing_type: z.enum(["inch", "pieces", "size"]),
  label: z.string().trim().min(1, "Option label is required"),
  price: z.number().min(0, "Price must be zero or more"),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name is required"),
  description: z.string().trim().max(5000).optional().default(""),
  category_id: z.string().uuid("Choose a category").nullable(),
  is_active: z.boolean().optional().default(true),
  is_featured: z.boolean().optional().default(false),
  // Photos are optional so imported catalogue products can be edited before
  // the admin uploads their images.
  images: z
    .array(
      z.object({
        image_url: z.string().url("Invalid image"),
        public_id: z.string().nullable().optional(),
      })
    )
    .default([]),
  options: z
    .array(productOptionSchema)
    .min(1, "Add at least one price option"),
});

export const requestSchema = z.object({
  type: z.enum(["return", "replace", "cancel"]),
  reason: z.string().trim().min(1, "Please select a reason"),
  description: z.string().trim().max(1000).optional().default(""),
  order_item_id: z.string().uuid().optional().nullable(),
});

export const orderUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  payment_status: z.enum(["pending", "paid", "refunded"]),
  confirmed_total: z.number().min(0).nullable(),
  courier: z.string().trim().max(80).optional().default(""),
  tracking_number: z.string().trim().max(120).optional().default(""),
  tracking_url: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  admin_note: z.string().trim().max(1000).optional().default(""),
});
