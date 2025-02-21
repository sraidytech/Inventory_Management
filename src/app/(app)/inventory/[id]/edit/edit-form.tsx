"use client";

import { notFound, useRouter } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProductFormData } from "@/lib/validations/product";
import { useState, useEffect } from "react";
import { ProductFormSkeleton } from "@/components/products/loading";

async function getProduct(id: string) {
  console.log('Fetching product with id:', id);
  const res = await fetch(`/api/products/${id}`, {
    cache: "no-store",
    credentials: "include",
  });

  console.log('Fetch response status:', res.status);
  if (!res.ok) {
    if (res.status === 404) {
      console.log('Product not found');
      return null;
    }
    const error = await res.json();
    console.error('Fetch error:', error);
    throw new Error(error.message || "Failed to fetch product");
  }

  const data = await res.json();
  console.log('Fetched product data:', data);
  return data;
}

export default function EditProductForm({
  id,
}: {
  id: string;
}) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        console.log('Loading product with id:', id);
        const data = await getProduct(id);
        console.log('Loaded product data:', data);
        if (!data) {
          console.log('Product not found, redirecting to 404');
          notFound();
        }
        setProduct(data);
      } catch (error) {
        console.error("Failed to load product:", error);
        setError("Failed to load product");
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  async function updateProduct(data: ProductFormData) {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update product");
      }

      router.push("/inventory");
      router.refresh();
    } catch (error) {
      console.error("Failed to update product:", error);
      setError(error instanceof Error ? error.message : "Failed to update product");
      setIsLoading(false);
    }
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <ProductFormSkeleton />;
  }

  if (!product) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <Link href="/inventory">
          <Button variant="outline">Back to Inventory</Button>
        </Link>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <ProductForm
          initialData={product}
          onSubmit={updateProduct}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
