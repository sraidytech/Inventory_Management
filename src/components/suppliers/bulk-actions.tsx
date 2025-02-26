"use client";

import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { useState } from "react";
import { toast } from "sonner";

interface BulkActionsProps {
  selectedSuppliers: string[];
  onClearSelection: () => void;
  onSuppliersDeleted: () => void;
}

export function BulkActions({
  selectedSuppliers,
  onClearSelection,
  onSuppliersDeleted,
}: BulkActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleBulkDelete = async () => {
    try {
      // Delete each selected supplier
      const results = await Promise.all(
        selectedSuppliers.map(async (id) => {
          const response = await fetch(`/api/suppliers/${id}`, {
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
        toast.success(`Successfully deleted ${successful.length} suppliers`);
      }
      
      if (failed.length > 0) {
        toast.error(`Failed to delete ${failed.length} suppliers. They may have associated products.`);
      }
      
      onSuppliersDeleted();
      onClearSelection();
    } catch (error) {
      console.error("Error deleting suppliers:", error);
      toast.error("Failed to delete suppliers");
    }
  };

  if (selectedSuppliers.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-background border rounded-lg shadow-lg flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedSuppliers.length} selected
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
        title="Delete Suppliers"
        description={`Are you sure you want to delete ${selectedSuppliers.length} suppliers? This action cannot be undone. Suppliers with associated products cannot be deleted.`}
      />
    </div>
  );
}
