"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowUpRight, ArrowDownRight, Search, Filter, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { generateFrenchInvoice } from "@/components/transactions/french-invoice";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionDetails } from "@/components/transactions/transaction-details";
import { TransactionsTableSkeleton } from "@/components/transactions/loading";
import { TranslatedText } from "@/components/language/translated-text";
import { useLanguage } from "@/components/language/language-provider";

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
  const { isRTL, language } = useLanguage();
  
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
  const [startDate, setStartDate] = useState<string>(
    searchParams.get("startDate") || ""
  );
  const [endDate, setEndDate] = useState<string>(
    searchParams.get("endDate") || ""
  );
  
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const page = Number(searchParams.get("page") || "1");

  // Search functionality
  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const partyName = transaction.type === "PURCHASE" 
      ? transaction.supplier?.name || ""
      : transaction.client?.name || "";
    
    return (
      partyName.toLowerCase().includes(searchLower) ||
      transaction.reference?.toLowerCase().includes(searchLower) ||
      transaction.notes?.toLowerCase().includes(searchLower) ||
      transaction.total.toString().includes(searchLower)
    );
  });

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
        
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch transactions");
        
        const data: TransactionsResponse = await response.json();
        setTransactions(data.data.items);
        setMetadata(data.data.metadata);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error(language === "ar" ? "فشل في تحميل المعاملات" : "Failed to load transactions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [page, typeFilter, statusFilter, startDate, endDate, metadata.limit, language]);

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

  // Arabic month names
  const arabicMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (language === "ar") {
      const day = date.getDate();
      const month = arabicMonths[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100";
      case "CANCELLED":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100";
      default:
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100";
    }
  };

  const getRemainingAmountColor = (amount: number) => {
    return amount > 0 ? "text-red-600 dark:text-red-400 font-medium" : "";
  };

  if (isLoading) {
    return <TransactionsTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className={`absolute ${isRTL ? 'right-2' : 'left-2'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
          <Input
            placeholder={language === "ar" ? "البحث عن المعاملات..." : "Search transactions..."}
            className={isRTL ? 'pr-8' : 'pl-8'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Dialog open={showPurchaseForm} onOpenChange={setShowPurchaseForm}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowDownRight className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                <TranslatedText namespace="transactions" id="recordPurchase" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle><TranslatedText namespace="transactions" id="recordPurchase" /></DialogTitle>
                <DialogDescription>
                  <TranslatedText namespace="transactions" id="purchaseDescription" />
                </DialogDescription>
              </DialogHeader>
              <TransactionForm 
                type="PURCHASE" 
                onSuccess={handleTransactionCreated} 
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={showSaleForm} onOpenChange={setShowSaleForm}>
            <DialogTrigger asChild>
              <Button>
                <ArrowUpRight className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                <TranslatedText namespace="transactions" id="recordSale" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle><TranslatedText namespace="transactions" id="recordSale" /></DialogTitle>
                <DialogDescription>
                  <TranslatedText namespace="transactions" id="saleDescription" />
                </DialogDescription>
              </DialogHeader>
              <TransactionForm 
                type="SALE" 
                onSuccess={handleTransactionCreated} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm"><TranslatedText namespace="common" id="filter" />:</span>
          </div>
          
          <Select
            value={typeFilter || "ALL"}
            onValueChange={handleTypeFilterChange}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={<TranslatedText namespace="transactions" id="transactionType" />} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL"><TranslatedText namespace="common" id="all" /></SelectItem>
              <SelectItem value="PURCHASE"><TranslatedText namespace="transactions" id="purchases" /></SelectItem>
              <SelectItem value="SALE"><TranslatedText namespace="transactions" id="sales" /></SelectItem>
              <SelectItem value="ADJUSTMENT"><TranslatedText namespace="transactions" id="adjustments" /></SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={statusFilter || "ALL"}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={<TranslatedText namespace="common" id="status" />} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL"><TranslatedText namespace="transactions" id="allStatuses" /></SelectItem>
              <SelectItem value="PENDING"><TranslatedText namespace="transactions" id="status.pending" /></SelectItem>
              <SelectItem value="COMPLETED"><TranslatedText namespace="transactions" id="status.completed" /></SelectItem>
              <SelectItem value="CANCELLED"><TranslatedText namespace="transactions" id="status.cancelled" /></SelectItem>
            </SelectContent>
          </Select>
          
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onApply={() => handlePageChange(1)}
            onClear={() => {
              setStartDate("");
              setEndDate("");
              handlePageChange(1);
            }}
          />
        </div>
        
        {/* Reset All Filters Button */}
        {(typeFilter || statusFilter || startDate || endDate) && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setTypeFilter(undefined);
              setStatusFilter(undefined);
              setStartDate("");
              setEndDate("");
              setSearchTerm("");
              
              const params = new URLSearchParams();
              params.set("page", "1");
              router.push(`/transactions?${params.toString()}`);
            }}
            className={isRTL ? 'mr-2' : 'ml-2'}
          >
            <TranslatedText namespace="common" id="resetFilters" />
          </Button>
        )}
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <table className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
              <thead className="text-xs uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-3"><TranslatedText namespace="common" id="date" /></th>
                  <th className="px-6 py-3"><TranslatedText namespace="common" id="type" /></th>
                  <th className="px-6 py-3"><TranslatedText namespace="transactions" id="party" /></th>
                  <th className="px-6 py-3"><TranslatedText namespace="transactions" id="items" /></th>
                  <th className="px-6 py-3"><TranslatedText namespace="common" id="total" /></th>
                  <th className="px-6 py-3"><TranslatedText namespace="transactions" id="remainingAmount" /></th>
                  <th className="px-6 py-3"><TranslatedText namespace="common" id="status" /></th>
                  <th className="px-6 py-3"><TranslatedText namespace="common" id="actions" /></th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                      <TranslatedText namespace="transactions" id="noTransactionsFound" />
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="bg-card border-b">
                      <td className="px-6 py-4">{formatDate(transaction.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center ${
                          transaction.type === "PURCHASE" 
                            ? "text-blue-600 dark:text-blue-400" 
                            : transaction.type === "SALE"
                            ? "text-green-600 dark:text-green-400"
                            : "text-orange-600 dark:text-orange-400"
                        }`}>
                          {transaction.type === "PURCHASE" ? (
                            <ArrowDownRight className={`${isRTL ? 'ml-1' : 'mr-1'} h-4 w-4`} />
                          ) : transaction.type === "SALE" ? (
                            <ArrowUpRight className={`${isRTL ? 'ml-1' : 'mr-1'} h-4 w-4`} />
                          ) : null}
                          <TranslatedText 
                            namespace="transactions" 
                            id={`type.${transaction.type.toLowerCase()}`} 
                          />
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {transaction.type === "PURCHASE" 
                          ? (transaction.supplier ? transaction.supplier.name : "N/A")
                          : (transaction.client ? transaction.client.name : "N/A")}
                      </td>
                      <td className="px-6 py-4">{transaction.items.length}</td>
                      <td className="px-6 py-4 font-medium">
                        DH {transaction.total.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 font-medium ${getRemainingAmountColor(transaction.remainingAmount)}`}>
                        DH {transaction.remainingAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          <TranslatedText 
                            namespace="transactions" 
                            id={`status.${transaction.status.toLowerCase()}`} 
                          />
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedTransaction(transaction)}
                              >
                                <TranslatedText namespace="common" id="viewDetails" />
                              </Button>
                            </DialogTrigger>
                            {selectedTransaction && selectedTransaction.id === transaction.id && (
                              <TransactionDetails 
                                transaction={selectedTransaction}
                                onClose={() => setSelectedTransaction(null)}
                              />
                            )}
                          </Dialog>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              try {
                                generateFrenchInvoice(transaction);
                                toast.success(language === "ar" ? "تم إنشاء الفاتورة بنجاح" : "Facture générée avec succès");
                              } catch (error) {
                                console.error("Error generating invoice:", error);
                                toast.error(language === "ar" ? "فشل في إنشاء الفاتورة" : "Échec de la génération de la facture");
                              }
                            }}
                          >
                            <FileText className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            <TranslatedText namespace="transactions" id="generateInvoice" />
                          </Button>
                        </div>
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
            <TranslatedText namespace="common" id="showing" /> {(metadata.page - 1) * metadata.limit + 1} <TranslatedText namespace="common" id="to" />{" "}
            {Math.min(metadata.page * metadata.limit, metadata.total)} <TranslatedText namespace="common" id="of" />{" "}
            {metadata.total} <TranslatedText namespace="transactions" id="transactions" />
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(metadata.page - 1)}
              disabled={metadata.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only"><TranslatedText namespace="common" id="previousPage" /></span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(metadata.page + 1)}
              disabled={metadata.page === metadata.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only"><TranslatedText namespace="common" id="nextPage" /></span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
