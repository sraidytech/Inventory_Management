import { z } from "zod";

export const productSchema = z.object({
  userId: z.string().optional(),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  sku: z
    .string()
    .min(3, "SKU must be at least 3 characters")
    .max(50, "SKU must be less than 50 characters")
    .regex(/^[A-Za-z0-9\-_]+$/, "SKU must contain only letters, numbers, hyphens, and underscores"),
  price: z
    .number()
    .min(0, "Price must be greater than or equal to 0")
    .max(1000000, "Price must be less than 1,000,000")
    .transform(val => Number(val.toFixed(2))), // Round to 2 decimal places for DH
  quantity: z
    .number()
    .min(0, "Quantity must be greater than or equal to 0")
    .max(1000000, "Quantity must be less than 1,000,000"),
  minQuantity: z
    .number()
    .min(0, "Minimum quantity must be greater than or equal to 0")
    .max(1000000, "Minimum quantity must be less than 1,000,000"),
  unit: z.enum(["KG", "GRAM", "PIECE"], {
    required_error: "Unit is required",
  }).default("PIECE"),
  categoryId: z.string().uuid("Invalid category ID"),
  supplierId: z.string().uuid("Invalid supplier ID"),
  image: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Helper function to format price in DH
export const formatPrice = (price: number) => {
  return `${price.toLocaleString('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} DH`;
};

// Helper function to format quantity with unit
export const formatQuantity = (quantity: number, unit: "KG" | "GRAM" | "PIECE") => {
  return `${quantity} ${unit}`;
};

// Helper function to convert between units
export const convertUnit = (value: number, fromUnit: "KG" | "GRAM" | "PIECE", toUnit: "KG" | "GRAM" | "PIECE") => {
  if (fromUnit === toUnit) return value;
  
  // Convert everything to grams first
  let inGrams = value;
  if (fromUnit === 'KG') {
    inGrams = value * 1000;
  }

  // Then convert to target unit
  if (toUnit === 'KG') {
    return inGrams / 1000;
  } else if (toUnit === 'GRAM') {
    return inGrams;
  }

  throw new Error('Cannot convert between these units');
};
