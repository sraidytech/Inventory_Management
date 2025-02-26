"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckSquare, Edit, PlusIcon, SearchIcon, Square, Trash2Icon } from "lucide-react";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { toast } from "sonner";
import { BulkActions } from "@/components/categories/bulk-actions";
import { CategoryForm } from "@/components/categories/category-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  description: string | null;
  _count: {
    products: number;
  };
}

export default function CategoriesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formDialog, setFormDialog] = useState<{
    isOpen: boolean;
    categoryId: string | null;
    categoryData: Partial<Category> | null;
  }>({
    isOpen: false,
    categoryId: null,
    categoryData: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    categoryId: string | null;
    categoryName: string;
  }>({
    isOpen: false,
    categoryId: null,
    categoryName: "",
  });
  const limit = 10;

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  };

  const handleDelete = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }

      toast.success("Category deleted successfully");
      fetchCategories();
      router.refresh();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete category");
    }
  };

  const openEditDialog = async (categoryId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/categories/${categoryId}`);
      if (!response.ok) throw new Error("Failed to fetch category");
      
      const data = await response.json();
      
      setFormDialog({
        isOpen: true,
        categoryId,
        categoryData: data.data,
      });
    } catch (error) {
      console.error("Error fetching category:", error);
      toast.error("Failed to load category data");
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize fetchCategories to prevent infinite loop
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/categories?${params}`);
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      setCategories(data.categories);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  // Fetch categories when component mounts or search/page changes
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage your product categories
          </p>
        </div>
        <Button onClick={() => setFormDialog({ isOpen: true, categoryId: null, categoryData: null })}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search categories..."
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
                    <th className="text-left p-4 w-8"></th>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Description</th>
                    <th className="text-right p-4">Products</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr 
                      key={category.id} 
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleCategorySelection(category.id)}
                        >
                          {selectedCategories.includes(category.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                      <td className="p-4">{category.name}</td>
                      <td className="p-4">{category.description || "-"}</td>
                      <td className="p-4 text-right">
                        {category._count.products}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(category.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteDialog({
                                isOpen: true,
                                categoryId: category.id,
                                categoryName: category.name,
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
              Showing {categories.length} of {total} categories
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

      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, categoryId: null, categoryName: "" })
        }
        onConfirm={async () => {
          if (!deleteDialog.categoryId) return;
          await handleDelete(deleteDialog.categoryId);
        }}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteDialog.categoryName}"? This action cannot be undone. Categories with associated products cannot be deleted.`}
      />

      <Dialog 
        open={formDialog.isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setFormDialog({ isOpen: false, categoryId: null, categoryData: null });
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {formDialog.categoryId ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm 
            initialData={formDialog.categoryData ? {
              id: formDialog.categoryId || '',
              name: formDialog.categoryData.name || '',
              description: formDialog.categoryData.description || '',
            } : undefined}
            onSuccess={() => {
              setFormDialog({ isOpen: false, categoryId: null, categoryData: null });
              fetchCategories();
            }}
          />
        </DialogContent>
      </Dialog>

      <BulkActions
        selectedCategories={selectedCategories}
        onClearSelection={() => setSelectedCategories([])}
        onCategoriesDeleted={fetchCategories}
      />
    </div>
  );
}
