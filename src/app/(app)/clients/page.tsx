"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckSquare, Edit, Phone, PlusIcon, SearchIcon, Square, Trash2Icon, DollarSign } from "lucide-react";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { toast } from "sonner";
import { BulkActions } from "@/components/clients/bulk-actions";
import { ClientForm } from "@/components/clients/client-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientsTableSkeleton } from "@/components/clients/loading";

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  address: string;
  notes?: string | null;
  totalDue: number;
  amountPaid: number;
  balance: number;
  _count: {
    transactions: number;
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [formDialog, setFormDialog] = useState<{
    isOpen: boolean;
    clientId: string | null;
    clientData: Partial<Client> | null;
  }>({
    isOpen: false,
    clientId: null,
    clientData: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    clientId: string | null;
    clientName: string;
  }>({
    isOpen: false,
    clientId: null,
    clientName: "",
  });
  const limit = 10;

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients((current) =>
      current.includes(clientId)
        ? current.filter((id) => id !== clientId)
        : [...current, clientId]
    );
  };

  const handleDelete = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete client");
      }

      toast.success("Client deleted successfully");
      fetchClients();
      router.refresh();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete client");
    }
  };

  const openEditDialog = async (clientId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch client");
      
      const data = await response.json();
      
      setFormDialog({
        isOpen: true,
        clientId,
        clientData: data,
      });
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error("Failed to load client data");
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize fetchClients to prevent infinite loop
  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/clients?${params}`);
      if (!response.ok) throw new Error("Failed to fetch clients");

      const data = await response.json();
      setClients(data.clients);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  // Fetch clients when component mounts or search/page changes
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage your clients and customer relationships
          </p>
        </div>
        <Button onClick={() => setFormDialog({ isOpen: true, clientId: null, clientData: null })}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <ClientsTableSkeleton />
      ) : (
        <>
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 w-8"></th>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Contact</th>
                    <th className="text-left p-4">Address</th>
                    <th className="text-right p-4">Balance</th>
                    <th className="text-right p-4">Transactions</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr 
                      key={client.id} 
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleClientSelection(client.id)}
                        >
                          {selectedClients.includes(client.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                      <td className="p-4">{client.name}</td>
                      <td className="p-4">
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{client.phone}</span>
                        </div>
                      </td>
                      <td className="p-4">{client.address}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end text-sm">
                          <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className={client.balance > 0 ? "text-destructive" : ""}>
                            {client.balance.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {client._count.transactions}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(client.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteDialog({
                                isOpen: true,
                                clientId: client.id,
                                clientName: client.name,
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
              Showing {clients.length} of {total} clients
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
          setDeleteDialog({ isOpen: false, clientId: null, clientName: "" })
        }
        onConfirm={async () => {
          if (!deleteDialog.clientId) return;
          await handleDelete(deleteDialog.clientId);
        }}
        title="Delete Client"
        description={`Are you sure you want to delete "${deleteDialog.clientName}"? This action cannot be undone. Clients with associated transactions cannot be deleted.`}
      />

      <Dialog 
        open={formDialog.isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setFormDialog({ isOpen: false, clientId: null, clientData: null });
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {formDialog.clientId ? "Edit Client" : "Add Client"}
            </DialogTitle>
          </DialogHeader>
          <ClientForm 
            initialData={formDialog.clientData ? {
              id: formDialog.clientId || '',
              name: formDialog.clientData.name || '',
              email: formDialog.clientData.email || '',
              phone: formDialog.clientData.phone || '',
              address: formDialog.clientData.address || '',
              notes: formDialog.clientData.notes || '',
              totalDue: formDialog.clientData.totalDue || 0,
              amountPaid: formDialog.clientData.amountPaid || 0,
              balance: formDialog.clientData.balance,
            } : undefined}
            onSuccess={() => {
              setFormDialog({ isOpen: false, clientId: null, clientData: null });
              fetchClients();
            }}
          />
        </DialogContent>
      </Dialog>

      <BulkActions
        selectedClients={selectedClients}
        onClearSelection={() => setSelectedClients([])}
        onClientsDeleted={fetchClients}
      />
    </div>
  );
}
