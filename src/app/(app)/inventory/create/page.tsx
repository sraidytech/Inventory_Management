"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ProductForm } from "@/components/products/product-form";
import { ProductFormData } from "@/lib/validations/product";
import { useAuth } from "@clerk/nextjs";
import { ProductFormSkeleton } from "@/components/products/loading";

export default function CreateProductPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="rounded-lg border bg-card">
          <div className="p-6">
            <ProductFormSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    router.push("/sign-in");
    return null;
  }

  const handleSubmit = async (data: ProductFormData) => {
    try {
      setIsLoading(true);
      // Validate data before sending
      const formattedData = {
        ...data,
        userId, // Add userId to the request
        price: Number(data.price),
        quantity: Number(data.quantity),
        minQuantity: Number(data.minQuantity),
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error('API Error:', result);
        
        if (result.errors) {
          throw new Error(Object.values(result.errors).flat().join(", "));
        } else if (result.error) {
          throw new Error(result.error);
        } else {
          throw new Error("Failed to create product");
        }
      }

      const result = await response.json();
      console.log('API Response:', result);

      startTransition(() => {
        router.push("/inventory");
        router.refresh();
      });
    } catch (error) {
      console.error("Error creating product:", error);
      setError(error instanceof Error ? error.message : "Failed to create product");
    } finally {
      setIsLoading(false);
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

      {error && (
        <div className="mb-6 p-4 bg-destructive/15 text-destructive rounded-md">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <ProductForm onSubmit={handleSubmit} isLoading={isLoading || isPending} />
        </div>
      </div>
    </div>
  );
}
