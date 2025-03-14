"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/validations/product";
import { AlertTriangle, CheckSquare, Eye, PlusIcon, SearchIcon, Square, Trash2Icon } from "lucide-react";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { toast } from "sonner";
import { BulkActions } from "@/components/products/bulk-actions";
import { useStockAlerts } from "@/hooks/use-stock-alerts";
import { ProductDetailsDialog } from "@/components/products/product-details-dialog";
import { useLanguage } from "@/components/language/language-provider";

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
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [detailsDialog, setDetailsDialog] = useState<{
    isOpen: boolean;
    productId: string | null;
  }>({
    isOpen: false,
    productId: null,
  });
  const { alerts = [] } = useStockAlerts();
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    productId: string | null;
    productName: string;
  }>({
    isOpen: false,
    productId: null,
    productName: "",
  });
  const { language, isRTL } = useLanguage();
  const limit = 10;

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  };

  const handleDelete = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete product");
      }

      const successMessage = language === "ar" ? "تم حذف المنتج بنجاح" : "Product deleted successfully";
      toast.success(successMessage);
      fetchProducts();
      router.refresh();
    } catch (error) {
      console.error("Error deleting product:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : language === "ar" 
          ? "فشل في حذف المنتج" 
          : "Failed to delete product";
      toast.error(errorMessage);
    }
  };

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
      if (!response.ok) throw new Error(language === "ar" ? "فشل في تحميل المنتجات" : "Failed to fetch products");

      const data = await response.json();
      console.log("Products API response:", data);
      
      // Handle both old and new API response formats
      if (data.success && data.data && data.data.items) {
        // New format: { success: true, data: { items: [...], metadata: {...} } }
        setProducts(data.data.items);
        setTotal(data.data.metadata.total);
      } else if (data.products) {
        // Old format: { products: [...], total: number, pages: number }
        setProducts(data.products);
        setTotal(data.total);
      } else {
        console.error("Unexpected products data structure:", data);
        const errorMessage = language === "ar" 
          ? "فشل في تحميل المنتجات: تنسيق بيانات غير متوقع" 
          : "Failed to load products: Unexpected data format";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, page, language]);

  // Fetch products when component mounts or search/page changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {language === "ar" ? "المخزون" : "Inventory"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "إدارة المنتجات ومستويات المخزون" : "Manage your products and stock levels"}
          </p>
        </div>
        <Button onClick={() => router.push("/inventory/create")}>
          <PlusIcon className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {language === "ar" ? "إضافة منتج" : "Add Product"}
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4`} />
          <Input
            placeholder={language === "ar" ? "البحث عن المنتجات..." : "Search products..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={isRTL ? 'pr-10' : 'pl-10'}
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
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
                <thead>
                  <tr className="border-b">
                    <th className={`${isRTL ? 'text-right' : 'text-left'} p-4 w-8`}></th>
                    <th className={`${isRTL ? 'text-right' : 'text-left'} p-4`}>
                      {language === "ar" ? "الاسم" : "Name"}
                    </th>
                    <th className={`${isRTL ? 'text-right' : 'text-left'} p-4`}>
                      {language === "ar" ? "رمز المنتج" : "SKU"}
                    </th>
                    <th className={`${isRTL ? 'text-right' : 'text-left'} p-4`}>
                      {language === "ar" ? "الفئة" : "Category"}
                    </th>
                    <th className={`${isRTL ? 'text-right' : 'text-left'} p-4`}>
                      {language === "ar" ? "المورد" : "Supplier"}
                    </th>
                    <th className={`${isRTL ? 'text-left' : 'text-right'} p-4`}>
                      {language === "ar" ? "السعر" : "Price"}
                    </th>
                    <th className={`${isRTL ? 'text-left' : 'text-right'} p-4`}>
                      {language === "ar" ? "الكمية" : "Quantity"}
                    </th>
                    <th className={`${isRTL ? 'text-left' : 'text-right'} p-4`}>
                      {language === "ar" ? "إجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr 
                      key={product.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setDetailsDialog({
                          isOpen: true,
                          productId: product.id,
                        });
                      }}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          {selectedProducts.includes(product.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                      <td className="p-4 flex items-center gap-2">
                        {alerts.some((alert) => alert.productId === product.id) && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                        {product.name}
                      </td>
                      <td className="p-4">{product.sku}</td>
                      <td className="p-4">{product.category.name}</td>
                      <td className="p-4">{product.supplier.name}</td>
                      <td className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>
                        {formatPrice(product.price)}
                      </td>
                      <td className={`p-4 ${isRTL ? 'text-left' : 'text-right'} ${
                        alerts.some((alert) => alert.productId === product.id)
                          ? "text-warning"
                          : ""
                      }`}>
                        {product.quantity} {product.unit === "KG" 
                          ? (language === "ar" ? "كغ" : "KG") 
                          : product.unit === "PIECE" 
                            ? (language === "ar" ? "قطعة" : "PIECE") 
                            : product.unit}
                      </td>
                      <td className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`} onClick={(e) => e.stopPropagation()}>
                        <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} gap-2`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailsDialog({
                                isOpen: true,
                                productId: product.id,
                              });
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/inventory/${product.id}/edit`);
                            }}
                          >
                            {language === "ar" ? "تعديل" : "Edit"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialog({
                                isOpen: true,
                                productId: product.id,
                                productName: product.name,
                              });
                            }}
                          >
                            <Trash2Icon className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
              {language === "ar" ? "عرض" : "Showing"} {(page - 1) * limit + 1} {language === "ar" ? "إلى" : "to"}{" "}
              {Math.min(page * limit, total)} {language === "ar" ? "من" : "of"}{" "}
              {total} {language === "ar" ? "منتجات" : "products"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {language === "ar" ? "السابق" : "Previous"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= total}
              >
                {language === "ar" ? "التالي" : "Next"}
              </Button>
            </div>
          </div>
        </>
      )}

      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, productId: null, productName: "" })
        }
        onConfirm={async () => {
          if (!deleteDialog.productId) return;
          await handleDelete(deleteDialog.productId);
        }}
        title={language === "ar" ? "حذف المنتج" : "Delete Product"}
        description={
          language === "ar" 
            ? `هل أنت متأكد أنك تريد حذف "${deleteDialog.productName}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete "${deleteDialog.productName}"? This action cannot be undone.`
        }
      />

      <BulkActions
        selectedProducts={selectedProducts}
        onClearSelection={() => setSelectedProducts([])}
        onProductsDeleted={fetchProducts}
      />

      <ProductDetailsDialog
        productId={detailsDialog.productId}
        isOpen={detailsDialog.isOpen}
        onClose={() => setDetailsDialog({ isOpen: false, productId: null })}
      />
    </div>
  );
}
