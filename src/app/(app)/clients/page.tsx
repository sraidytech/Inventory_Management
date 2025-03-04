"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckSquare, Edit, Phone, PlusIcon, SearchIcon, Square, Trash2Icon, LayoutGrid, LayoutList, Mail, MapPin, DollarSign, ShoppingBag } from "lucide-react";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { toast } from "sonner";
import { BulkActions } from "@/components/clients/bulk-actions";
import { ClientForm } from "@/components/clients/client-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ClientsTableSkeleton, ClientsCardSkeleton } from "@/components/clients/loading";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/language/language-provider";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const { isRTL } = useLanguage();
  const commonT = useTranslations("common");
  const clientsT = useTranslations("clients");
  
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
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
        throw new Error(error.error || clientsT("deleteError"));
      }

      toast.success(clientsT("deleteSuccess"));
      fetchClients();
      router.refresh();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error(error instanceof Error ? error.message : clientsT("deleteError"));
    }
  };

  const openEditDialog = async (clientId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) throw new Error(clientsT("fetchError"));
      
      const client = await response.json();
      console.log("Fetched client data:", client);
      
      // Use the client data from the table if the API returns empty values
      const clientToEdit = clients.find(c => c.id === clientId);
      console.log("Client from table:", clientToEdit);
      
      if (clientToEdit) {
        setFormDialog({
          isOpen: true,
          clientId,
          clientData: {
            id: clientId,
            name: clientToEdit.name,
            email: clientToEdit.email || "",
            phone: clientToEdit.phone,
            address: clientToEdit.address,
            notes: clientToEdit.notes || "",
            totalDue: clientToEdit.totalDue,
            amountPaid: clientToEdit.amountPaid,
            balance: clientToEdit.balance,
          },
        });
      } else {
        toast.error(clientsT("fetchError"));
      }
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error(clientsT("fetchError"));
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
      if (!response.ok) throw new Error(clientsT("fetchError"));

      const data = await response.json();
      console.log("Clients API response:", data);
      
      // Handle both old and new API response formats
      if (data.success && data.data && data.data.items) {
        // New format: { success: true, data: { items: [...], metadata: {...} } }
        setClients(data.data.items);
        setTotal(data.data.metadata.total);
      } else if (data.clients) {
        // Old format: { clients: [...], total: number, pages: number }
        setClients(data.clients);
        setTotal(data.total);
      } else {
        console.error("Unexpected clients data structure:", data);
        toast.error(clientsT("fetchError"));
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error(clientsT("fetchError"));
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
          <h1 className="text-2xl font-bold">{clientsT("title")}</h1>
          <p className="text-muted-foreground">
            {clientsT("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-muted rounded-lg p-1 flex">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('card')}
              aria-label={clientsT("cardView")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('table')}
              aria-label={clientsT("tableView")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setFormDialog({ isOpen: true, clientId: null, clientData: null })}>
            <PlusIcon className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {clientsT("addClient")}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4`} />
          <Input
            placeholder={clientsT("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={isRTL ? 'pr-10' : 'pl-10'}
          />
        </div>
      </div>

      {isLoading ? (
        viewMode === 'card' ? <ClientsCardSkeleton /> : <ClientsTableSkeleton />
      ) : (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {clients.map((client) => (
                <Card key={client.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold">{client.name}</CardTitle>
                      <div className="flex gap-1">
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
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{client.phone}</span>
                      </div>
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="line-clamp-2">{client.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{clientsT("balance")}:</span>
                        <span className={client.balance > 0 ? "text-destructive font-medium" : "font-medium"}>
                          DH {client.balance.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{clientsT("transactions")}:</span>
                        <span>{client._count.transactions}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(client.id)}
                    >
                      <Edit className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {clientsT("edit")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeleteDialog({
                          isOpen: true,
                          clientId: client.id,
                          clientName: client.name,
                        });
                      }}
                    >
                      <Trash2Icon className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {clientsT("delete")}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>{commonT("name")}</TableHead>
                    <TableHead>{clientsT("contact")}</TableHead>
                    <TableHead>{commonT("address")}</TableHead>
                    <TableHead className="text-right">{clientsT("balance")}</TableHead>
                    <TableHead className="text-right">{clientsT("transactions")}</TableHead>
                    <TableHead className="text-right">{commonT("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>{client.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Phone className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-muted-foreground`} />
                            <span>{client.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>{client.address}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end text-sm">
                            <span className="mr-1 text-muted-foreground">DH</span>
                            <span className={client.balance > 0 ? "text-destructive" : ""}>
                              {client.balance.toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {client._count.transactions}
                        </TableCell>
                        <TableCell className="text-right">
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
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {commonT("showing")} {clients.length} {commonT("of")} {total} {clientsT("clients")}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {commonT("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= total}
              >
                {commonT("next")}
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
        title={clientsT("deleteClient")}
        description={`${clientsT("deleteConfirmation")} "${deleteDialog.clientName}"? ${clientsT("deleteWarning")}`}
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
              {formDialog.clientId ? clientsT("editClient") : clientsT("addClient")}
            </DialogTitle>
            <DialogDescription>
              {formDialog.clientId 
                ? clientsT("editDescription") 
                : clientsT("addDescription")}
            </DialogDescription>
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
              balance: formDialog.clientData.balance || 0,
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
