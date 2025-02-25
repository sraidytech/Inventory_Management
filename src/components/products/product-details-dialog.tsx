"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/validations/product";
import { AlertTriangle, Edit, Trash2 } from "lucide-react";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { toast } from "sonner";

interface ProductDetailsProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ProductDetails {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  quantity: number;
  minQuantity: number;
  unit: "KG" | "PIECE";
  image?: string;
  category: {
    id: string;
    name: string;
  };
  supplier: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function ProductDetailsDialog({
  productId,
  isOpen,
  onClose,
}: ProductDetailsProps) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchProductDetails() {
      if (!productId || !isOpen) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/products/${productId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("Product not found");
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch product details");
        }

        const responseData = await response.json();
        console.log('Product details response:', responseData);
        
        if (responseData.success && responseData.data) {
          console.log('Product details received:', responseData.data);
          setProduct(responseData.data);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch product details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProductDetails();
  }, [productId, isOpen]);

  const handleDelete = async () => {
    if (!product) return;

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete product");
      }

      toast.success("Product deleted successfully");
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete product");
    }
  };

  const handleEdit = () => {
    if (!product) return;
    router.push(`/inventory/${product.id}/edit`);
    onClose();
  };

  const isLowStock = product ? product.quantity < product.minQuantity : false;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {isLoading ? (
                <div className="h-8 w-3/4 bg-muted animate-pulse rounded-md" />
              ) : error ? (
                <span>Error: {error}</span>
              ) : product ? (
                <>
                  {product.name}
                  {isLowStock && (
                    <span title="Low stock">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    </span>
                  )}
                </>
              ) : (
                "Product Details"
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col space-y-4 p-4">
              <div className="h-32 bg-muted animate-pulse rounded-md" />
              <div className="h-24 bg-muted animate-pulse rounded-md" />
              <div className="h-24 bg-muted animate-pulse rounded-md" />
            </div>
          ) : error ? (
            <div className="p-4 text-destructive">{error}</div>
          ) : product ? (
            <>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SKU:</span>
                      <span className="font-medium">{product.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">{formatPrice(product.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className={`font-medium ${isLowStock ? "text-warning" : ""}`}>
                        {product.quantity} {product.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Quantity:</span>
                      <span className="font-medium">
                        {product.minQuantity} {product.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span
                        className={`font-medium ${
                          product.quantity <= 0
                            ? "text-destructive"
                            : isLowStock
                            ? "text-warning"
                            : "text-green-500"
                        }`}
                      >
                        {product.quantity <= 0
                          ? "Out of Stock"
                          : isLowStock
                          ? "Low Stock"
                          : "In Stock"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Category and Supplier */}
                <Card>
                  <CardHeader>
                    <CardTitle>Category & Supplier</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{product.category?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supplier:</span>
                      <span className="font-medium">{product.supplier?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supplier Email:</span>
                      {product.supplier?.email ? (
                        <a
                          href={`mailto:${product.supplier.email}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {product.supplier.email}
                        </a>
                      ) : (
                        <span className="font-medium">N/A</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supplier Phone:</span>
                      {product.supplier?.phone ? (
                        <a
                          href={`tel:${product.supplier.phone}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {product.supplier.phone}
                        </a>
                      ) : (
                        <span className="font-medium">N/A</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{product.description}</p>
                  </CardContent>
                </Card>

                {/* Stock Value */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Stock Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-muted-foreground">Unit Price × Quantity</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(product.price)} × {product.quantity} {product.unit}
                        </p>
                      </div>
                      <div className="text-xl font-bold">
                        {formatPrice(product.price * product.quantity)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="mt-6 flex justify-between">
                <div>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="mr-2"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
                <div>
                  <Button variant="outline" onClick={onClose} className="mr-2">
                    Close
                  </Button>
                  <Button onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {product && (
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Product"
          description={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        />
      )}
    </>
  );
}
