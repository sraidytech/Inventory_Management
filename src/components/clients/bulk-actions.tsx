"use client";

import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { useState } from "react";
import { toast } from "sonner";

interface BulkActionsProps {
  selectedClients: string[];
  onClearSelection: () => void;
  onClientsDeleted: () => void;
}

export function BulkActions({
  selectedClients,
  onClearSelection,
  onClientsDeleted,
}: BulkActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleBulkDelete = async () => {
    try {
      // Delete each selected client
      const results = await Promise.all(
        selectedClients.map(async (id) => {
          const response = await fetch(`/api/clients/${id}`, {
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
        toast.success(`Successfully deleted ${successful.length} clients`);
      }
      
      if (failed.length > 0) {
        toast.error(`Failed to delete ${failed.length} clients. They may have associated transactions.`);
      }
      
      onClientsDeleted();
      onClearSelection();
    } catch (error) {
      console.error("Error deleting clients:", error);
      toast.error("Failed to delete clients");
    }
  };

  if (selectedClients.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-background border rounded-lg shadow-lg flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedClients.length} selected
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
        title="Delete Clients"
        description={`Are you sure you want to delete ${selectedClients.length} clients? This action cannot be undone. Clients with associated transactions cannot be deleted.`}
      />
    </div>
  );
}
