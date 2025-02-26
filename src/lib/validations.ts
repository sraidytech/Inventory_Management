import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  price: z.number().min(0, "Price must be positive"),
  quantity: z.number().min(0, "Quantity must be positive"),
  minQuantity: z.number().min(0, "Minimum quantity must be positive"),
  image: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  supplierId: z.string().min(1, "Supplier is required"),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  userId: z.string().min(1, "User ID is required"),
});

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  userId: z.string().min(1, "User ID is required"),
});

export const supplierFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
});

export const transactionSchema = z.object({
  type: z.enum(["PURCHASE", "SALE", "ADJUSTMENT"]),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
  total: z.number().min(0, "Total must be positive"),
  notes: z.string().optional(),
  userId: z.string().min(1, "User ID is required"),
  items: z.array(z.object({
    quantity: z.number().min(1, "Quantity must be positive"),
    price: z.number().min(0, "Price must be positive"),
    productId: z.string().min(1, "Product ID is required"),
  })),
});

export const userSettingsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  language: z.enum(["en", "ar"]).default("en"),
  theme: z.enum(["light", "dark"]).default("light"),
  notifications: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
