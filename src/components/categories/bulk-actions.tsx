"use client";

import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { useState } from "react";
import { toast } from "sonner";

interface BulkActionsProps {
  selectedCategories: string[];
  onClearSelection: () => void;
  onCategoriesDeleted: () => void;
}

export function BulkActions({
  selectedCategories,
  onClearSelection,
  onCategoriesDeleted,
}: BulkActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleBulkDelete = async () => {
    try {
      // Delete each selected category
      const results = await Promise.all(
        selectedCategories.map(async (id) => {
          const response = await fetch(`/api/categories/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          
          if (!response.ok) {
            const error = await response.json();
            return { id, success: false, error: error.error || "Failed to delete" };
          }
          
          return { id, success: true };
        })
      );

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        toast.success(`Successfully deleted ${successful.length} categories`);
      }
      
      if (failed.length > 0) {
        toast.error(`Failed to delete ${failed.length} categories. They may have associated products.`);
      }
      
      onCategoriesDeleted();
      onClearSelection();
    } catch (error) {
      console.error("Error deleting categories:", error);
      toast.error("Failed to delete categories");
    }
  };

  if (selectedCategories.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-background border rounded-lg shadow-lg flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedCategories.length} selected
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onClearSelection}
      >
        Clear
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsDeleteDialogOpen(true)}
      >
        Delete Selected
      </Button>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Categories"
        description={`Are you sure you want to delete ${selectedCategories.length} categories? This action cannot be undone. Categories with associated products cannot be deleted.`}
      />
    </div>
  );
}
