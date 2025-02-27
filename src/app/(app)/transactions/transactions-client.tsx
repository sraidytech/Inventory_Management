"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ArrowUpRight, ArrowDownRight, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionDetails } from "@/components/transactions/transaction-details";
import { TransactionsTableSkeleton } from "@/components/transactions/loading";

interface Transaction {
  id: string;
  type: "PURCHASE" | "SALE" | "ADJUSTMENT";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  total: number;
  amountPaid: number;
  remainingAmount: number;
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "CHECK" | null;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
  } | null;
  supplier?: {
    id: string;
    name: string;
  } | null;
  items: {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      price: number;
      quantity: number;
      unit: string;
    };
  }[];
}

interface TransactionsResponse {
  success: boolean;
  data: {
    items: Transaction[];
    metadata: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export function TransactionsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metadata, setMetadata] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(
    searchParams.get("type") || undefined
  );
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    searchParams.get("status") || undefined
  );
  
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const page = Number(searchParams.get("page") || "1");

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        let url = `/api/transactions?page=${page}&limit=${metadata.limit}`;
        
        if (typeFilter) {
          url += `&type=${typeFilter}`;
        }
        
        if (statusFilter) {
          url += `&status=${statusFilter}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch transactions");
        
        const data: TransactionsResponse = await response.json();
        setTransactions(data.data.items);
        setMetadata(data.data.metadata);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load transactions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [page, typeFilter, statusFilter, metadata.limit]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    
    if (typeFilter) {
      params.set("type", typeFilter);
    } else {
      params.delete("type");
    }
    
    if (statusFilter) {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }
    
    router.push(`/transactions?${params.toString()}`);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value === "ALL" ? undefined : value);
    handlePageChange(1); // Reset to first page when filter changes
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "ALL" ? undefined : value);
    handlePageChange(1); // Reset to first page when filter changes
  };

  const handleTransactionCreated = () => {
    setShowPurchaseForm(false);
    setShowSaleForm(false);
    // Refresh data
    handlePageChange(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (isLoading) {
    return <TransactionsTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Dialog open={showPurchaseForm} onOpenChange={setShowPurchaseForm}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowDownRight className="mr-2 h-4 w-4" />
                Record Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <TransactionForm 
                type="PURCHASE" 
                onSuccess={handleTransactionCreated} 
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={showSaleForm} onOpenChange={setShowSaleForm}>
            <DialogTrigger asChild>
              <Button>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Record Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <TransactionForm 
                type="SALE" 
                onSuccess={handleTransactionCreated} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Filters:</span>
        </div>
        <Select
          value={typeFilter || "ALL"}
          onValueChange={handleTypeFilterChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Transaction Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="PURCHASE">Purchases</SelectItem>
            <SelectItem value="SALE">Sales</SelectItem>
            <SelectItem value="ADJUSTMENT">Adjustments</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={statusFilter || "ALL"}
          onValueChange={handleStatusFilterChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Party</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="bg-white border-b">
                      <td className="px-6 py-4">{formatDate(transaction.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center ${
                          transaction.type === "PURCHASE" 
                            ? "text-blue-600" 
                            : transaction.type === "SALE"
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}>
                          {transaction.type === "PURCHASE" ? (
                            <ArrowDownRight className="mr-1 h-4 w-4" />
                          ) : transaction.type === "SALE" ? (
                            <ArrowUpRight className="mr-1 h-4 w-4" />
                          ) : null}
                          {transaction.type.charAt(0) + transaction.type.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {transaction.type === "PURCHASE" 
                          ? transaction.supplier?.name || "N/A"
                          : transaction.client?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4">{transaction.items.length}</td>
                      <td className="px-6 py-4 font-medium">
                        DH {transaction.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status.charAt(0) + transaction.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedTransaction(transaction)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          {selectedTransaction && selectedTransaction.id === transaction.id && (
                            <TransactionDetails 
                              transaction={selectedTransaction}
                              onClose={() => setSelectedTransaction(null)}
                            />
                          )}
                        </Dialog>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {metadata.totalPages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(metadata.page - 1) * metadata.limit + 1} to{" "}
            {Math.min(metadata.page * metadata.limit, metadata.total)} of{" "}
            {metadata.total} transactions
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(metadata.page - 1)}
              disabled={metadata.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous Page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(metadata.page + 1)}
              disabled={metadata.page === metadata.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
