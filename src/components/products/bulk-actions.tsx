"use client";

import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { useState } from "react";
import { toast } from "sonner";

interface BulkActionsProps {
  selectedProducts: string[];
  onClearSelection: () => void;
  onProductsDeleted: () => void;
}

export function BulkActions({
  selectedProducts,
  onClearSelection,
  onProductsDeleted,
}: BulkActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleBulkDelete = async () => {
    try {
      // Delete each selected product
      await Promise.all(
        selectedProducts.map((id) =>
          fetch(`/api/products/${id}`, {
            method: "DELETE",
            credentials: "include",
          })
        )
      );

      toast.success(`Successfully deleted ${selectedProducts.length} products`);
      onProductsDeleted();
      onClearSelection();
    } catch (error) {
      console.error("Error deleting products:", error);
      toast.error("Failed to delete some products");
    }
  };

  if (selectedProducts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-background border rounded-lg shadow-lg flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedProducts.length} selected
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
        title="Delete Products"
        description={`Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`}
      />
    </div>
  );
}
