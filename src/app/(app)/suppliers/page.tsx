"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckSquare, Edit, Phone, PlusIcon, SearchIcon, Square, Trash2Icon } from "lucide-react";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { toast } from "sonner";
import { BulkActions } from "@/components/suppliers/bulk-actions";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/components/language/language-provider";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  _count: {
    products: number;
  };
}

export default function SuppliersPage() {
  const router = useRouter();
  const { isRTL } = useLanguage();
  const commonT = useTranslations("common");
  const suppliersT = useTranslations("suppliers");
  
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [formDialog, setFormDialog] = useState<{
    isOpen: boolean;
    supplierId: string | null;
    supplierData: Partial<Supplier> | null;
  }>({
    isOpen: false,
    supplierId: null,
    supplierData: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    supplierId: string | null;
    supplierName: string;
  }>({
    isOpen: false,
    supplierId: null,
    supplierName: "",
  });
  const limit = 10;

  const toggleSupplierSelection = (supplierId: string) => {
    setSelectedSuppliers((current) =>
      current.includes(supplierId)
        ? current.filter((id) => id !== supplierId)
        : [...current, supplierId]
    );
  };

  const handleDelete = async (supplierId: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || suppliersT("deleteError"));
      }

      toast.success(suppliersT("deleteSuccess"));
      fetchSuppliers();
      router.refresh();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error(error instanceof Error ? error.message : suppliersT("deleteError"));
    }
  };

  const openEditDialog = async (supplierId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/suppliers/${supplierId}`);
      if (!response.ok) throw new Error(suppliersT("fetchError"));
      
      const data = await response.json();
      
      setFormDialog({
        isOpen: true,
        supplierId,
        supplierData: data.data,
      });
    } catch (error) {
      console.error("Error fetching supplier:", error);
      toast.error(suppliersT("fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize fetchSuppliers to prevent infinite loop
  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/suppliers?${params}`);
      if (!response.ok) throw new Error(suppliersT("fetchError"));

      const data = await response.json();
      setSuppliers(data.suppliers);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error(suppliersT("fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  // Fetch suppliers when component mounts or search/page changes
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{suppliersT("title")}</h1>
          <p className="text-muted-foreground">
            {suppliersT("subtitle")}
          </p>
        </div>
        <Button onClick={() => setFormDialog({ isOpen: true, supplierId: null, supplierData: null })}>
          <PlusIcon className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {suppliersT("addSupplier")}
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4`} />
          <Input
            placeholder={suppliersT("searchPlaceholder")}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>{commonT("name")}</TableHead>
                    <TableHead>{commonT("phone")}</TableHead>
                    <TableHead>{commonT("address")}</TableHead>
                    <TableHead className={isRTL ? "text-left" : "text-right"}>{commonT("products")}</TableHead>
                    <TableHead className={isRTL ? "text-left" : "text-right"}>{commonT("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleSupplierSelection(supplier.id)}
                        >
                          {selectedSuppliers.includes(supplier.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>{supplier.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Phone className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-muted-foreground`} />
                          <span>{supplier.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>{supplier.address}</TableCell>
                      <TableCell className={isRTL ? "text-left" : "text-right"}>
                        {supplier._count.products}
                      </TableCell>
                      <TableCell className={isRTL ? "text-left" : "text-right"}>
                        <div className={`flex ${isRTL ? "justify-start" : "justify-end"} gap-2`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(supplier.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteDialog({
                                isOpen: true,
                                supplierId: supplier.id,
                                supplierName: supplier.name,
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

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {commonT("showing")} {suppliers.length} {commonT("of")} {total} {suppliersT("suppliers")}
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
          setDeleteDialog({ isOpen: false, supplierId: null, supplierName: "" })
        }
        onConfirm={async () => {
          if (!deleteDialog.supplierId) return;
          await handleDelete(deleteDialog.supplierId);
        }}
        title={suppliersT("deleteSupplier")}
        description={`${suppliersT("deleteConfirmation")} "${deleteDialog.supplierName}"? ${suppliersT("deleteWarning")}`}
      />

      <Dialog 
        open={formDialog.isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setFormDialog({ isOpen: false, supplierId: null, supplierData: null });
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {formDialog.supplierId ? suppliersT("editSupplier") : suppliersT("addSupplier")}
            </DialogTitle>
          </DialogHeader>
          <SupplierForm 
            initialData={formDialog.supplierData ? {
              id: formDialog.supplierId || '',
              name: formDialog.supplierData.name || '',
              phone: formDialog.supplierData.phone || '',
              address: formDialog.supplierData.address || '',
            } : undefined}
            onSuccess={() => {
              setFormDialog({ isOpen: false, supplierId: null, supplierData: null });
              fetchSuppliers();
            }}
          />
        </DialogContent>
      </Dialog>

      <BulkActions
        selectedSuppliers={selectedSuppliers}
        onClearSelection={() => setSelectedSuppliers([])}
        onSuppliersDeleted={fetchSuppliers}
      />
    </div>
  );
}
