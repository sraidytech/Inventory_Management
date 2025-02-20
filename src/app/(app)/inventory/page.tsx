"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/validations/product";
import { PlusIcon, SearchIcon } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  unit: "KG" | "GRAM" | "PIECE";
  category: {
    name: string;
  };
  supplier: {
    name: string;
  };
}

export default function InventoryPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Memoize fetchProducts to prevent infinite loop
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      setProducts(data.products);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  // Fetch products when component mounts or search/page changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your products and stock levels
          </p>
        </div>
        <Button onClick={() => router.push("/inventory/create")}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">SKU</th>
                    <th className="text-left p-4">Category</th>
                    <th className="text-left p-4">Supplier</th>
                    <th className="text-right p-4">Price</th>
                    <th className="text-right p-4">Quantity</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b">
                      <td className="p-4">{product.name}</td>
                      <td className="p-4">{product.sku}</td>
                      <td className="p-4">{product.category.name}</td>
                      <td className="p-4">{product.supplier.name}</td>
                      <td className="p-4 text-right">
                        {formatPrice(product.price)}
                      </td>
                      <td className="p-4 text-right">
                        {product.quantity} {product.unit}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/inventory/${product.id}`)
                          }
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {products.length} of {total} products
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= total}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
