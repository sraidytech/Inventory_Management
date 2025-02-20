"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { ProductFormData } from "@/lib/validations/product";

export default function CreateProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: ProductFormData) => {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      router.push("/inventory");
      router.refresh();
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Product</h1>
        <p className="text-muted-foreground">
          Add a new product to your inventory
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <ProductForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
