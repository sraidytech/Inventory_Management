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
        const response = await getProduct(id);
        console.log('Loaded product data:', response);
        if (!response) {
          console.log('Product not found, redirecting to 404');
          notFound();
        }
        
        // Check if the response has the expected structure
        if (!response.success || !response.data) {
          console.error('Invalid API response structure:', response);
          throw new Error('Invalid API response structure');
        }
        
        // Extract the product data from the response
        const productData = response.data;
        
        // Create a formatted version of the data for the form
        const formattedData = {
          name: productData.name || '',
          description: productData.description || '',
          sku: productData.sku || '',
          price: Number(productData.price || 0),
          quantity: Number(productData.quantity || 0),
          minQuantity: Number(productData.minQuantity || 0),
          unit: productData.unit || 'KG',
          categoryId: productData.categoryId || '',
          supplierId: productData.supplierId || '',
          image: productData.image || '',
        };
        
        console.log('Formatted data for form:', formattedData);
        setProduct(formattedData);
      } catch (error) {
        console.error("Failed to load product:", error);
        setError("Failed to load product");
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  async function updateProduct(formData: ProductFormData) {
    try {
      setIsLoading(true);
      // Format data before sending
      const requestData = {
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        minQuantity: Number(formData.minQuantity),
      };

      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors) {
          throw new Error(Object.values(errorData.errors).flat().join(", "));
        }
        throw new Error(errorData.message || "Failed to update product");
      }

      const responseData = await response.json();
      console.log('Update response:', responseData);

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
