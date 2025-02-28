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

export const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  notes: z.string().optional(),
  totalDue: z.number().min(0, "Total due must be positive").optional(),
  amountPaid: z.number().min(0, "Amount paid must be positive").optional(),
  balance: z.number().optional(),
  userId: z.string().min(1, "User ID is required"),
});

export const clientFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  email: z.string().optional(),
  notes: z.string().optional(),
  totalDue: z.number().min(0, "Total due must be positive").optional(),
  amountPaid: z.number().min(0, "Amount paid must be positive").optional(),
});

export const transactionSchema = z.object({
  type: z.enum(["PURCHASE", "SALE", "ADJUSTMENT"]),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
  total: z.number().min(0, "Total must be positive"),
  amountPaid: z.number().min(0, "Amount paid must be positive").optional(),
  remainingAmount: z.number().min(0, "Remaining amount must be positive").optional(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHECK"]).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  userId: z.string().min(1, "User ID is required"),
  clientId: z.string().optional(),
  supplierId: z.string().optional(),
  items: z.array(z.object({
    quantity: z.number().min(1, "Quantity must be positive"),
    price: z.number().min(0, "Price must be positive"),
    productId: z.string().min(1, "Product ID is required"),
  })),
});

export const transactionFormSchema = z.object({
  type: z.enum(["PURCHASE", "SALE", "ADJUSTMENT"]),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).default("PENDING"),
  total: z.number().min(0, "Total must be positive"),
  amountPaid: z.number().min(0, "Amount paid must be positive").default(0),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHECK"]).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  clientId: z.string().optional(),
  supplierId: z.string().optional(),
  items: z.array(z.object({
    quantity: z.number().min(1, "Quantity must be positive"),
    price: z.number().min(0, "Price must be positive"),
    productId: z.string().min(1, "Product ID is required"),
  })).min(1, "At least one item is required"),
  userId: z.string().optional(), // Make userId optional for form validation
});

export const paymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHECK"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["COMPLETED", "PENDING", "FAILED"]).default("COMPLETED"),
  transactionId: z.string().min(1, "Transaction ID is required"),
  clientId: z.string().optional(),
  userId: z.string().optional(), // Make userId optional for form validation
});

export const paymentFormSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHECK"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
  transactionId: z.string().min(1, "Transaction ID is required"),
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
export type ClientInput = z.infer<typeof clientSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
