"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TranslatedText } from "@/components/language/translated-text";
import { useLanguage } from "@/components/language/language-provider";
import { ExpenseDetails } from "@/components/expenses/expense-details";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { PlusCircle, Search, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import the types from expense-details.tsx
interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CHECK";
  reference: string | null;
  notes: string | null;
  categoryId: string;
  category: ExpenseCategory;
  createdAt: string;
  updatedAt: string;
}

export function ExpensesClient() {
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [page, searchTerm, selectedStatus, selectedCategory]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = `/api/expenses?page=${page}&limit=10`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (selectedStatus && selectedStatus !== "all") {
        url += `&status=${selectedStatus}`;
      }
      
      if (selectedCategory && selectedCategory !== "all") {
        url += `&categoryId=${selectedCategory}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      
      const data = await response.json();
      setExpenses(data.expenses);
      setTotalPages(data.totalPages || 1);
      setTotalExpenses(data.total || 0);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error(
        language === "ar"
          ? "فشل في تحميل المصاريف"
          : "Failed to load expenses"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/expense-categories?limit=100");
      if (!response.ok) {
        throw new Error("Failed to fetch expense categories");
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching expense categories:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === "ar" ? "هل أنت متأكد من حذف هذا المصروف؟" : "Are you sure you want to delete this expense?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }
      
      toast.success(
        language === "ar"
          ? "تم حذف المصروف بنجاح"
          : "Expense deleted successfully"
      );
      
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error(
        language === "ar"
          ? "فشل في حذف المصروف"
          : "Failed to delete expense"
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPP", {
      locale: language === "ar" ? ar : undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 dark:text-green-400";
      case "CANCELLED":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-yellow-600 dark:text-yellow-400";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            <TranslatedText namespace="expenses" id="title" />
          </h2>
          <p className="text-muted-foreground">
            <TranslatedText namespace="expenses" id="subtitle" />
          </p>
        </div>
        <Button onClick={() => router.push("/expenses/new")}>
          <PlusCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          <TranslatedText namespace="expenses" id="addExpense" />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "ar" ? "البحث عن مصاريف..." : "Search expenses..."}
              className={`${isRTL ? 'pr-8' : 'pl-8'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={language === "ar" ? "جميع الفئات" : "All Categories"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === "ar" ? "جميع الفئات" : "All Categories"}
              </SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={language === "ar" ? "جميع الحالات" : "All Statuses"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === "ar" ? "جميع الحالات" : "All Statuses"}
              </SelectItem>
              <SelectItem value="PENDING">
                <TranslatedText namespace="expenses" id="status.pending" />
              </SelectItem>
              <SelectItem value="COMPLETED">
                <TranslatedText namespace="expenses" id="status.completed" />
              </SelectItem>
              <SelectItem value="CANCELLED">
                <TranslatedText namespace="expenses" id="status.cancelled" />
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <TranslatedText namespace="expenses" id="amount" />
                </TableHead>
                <TableHead>
                  <TranslatedText namespace="common" id="description" />
                </TableHead>
                <TableHead>
                  <TranslatedText namespace="expenses" id="category" />
                </TableHead>
                <TableHead>
                  <TranslatedText namespace="common" id="status" />
                </TableHead>
                <TableHead>
                  <TranslatedText namespace="common" id="date" />
                </TableHead>
                <TableHead className="text-right">
                  <TranslatedText namespace="common" id="actions" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <TranslatedText namespace="expenses" id="noExpensesFound" />
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      DH {expense.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.category.name}</TableCell>
                    <TableCell>
                      <span className={getStatusColor(expense.status)}>
                        <TranslatedText
                          namespace="expenses"
                          id={`status.${expense.status.toLowerCase()}`}
                        />
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(expense.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DialogTrigger asChild>
                              <DropdownMenuItem onClick={() => setSelectedExpense(expense)}>
                                <TranslatedText namespace="common" id="view" />
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DropdownMenuItem onClick={() => router.push(`/expenses/${expense.id}/edit`)}>
                              <TranslatedText namespace="common" id="edit" />
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 dark:text-red-400"
                              onClick={() => handleDelete(expense.id)}
                            >
                              <TranslatedText namespace="common" id="delete" />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {selectedExpense && (
                          <ExpenseDetails 
                            expense={selectedExpense} 
                            onClose={() => setSelectedExpense(null)} 
                          />
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!loading && expenses.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <TranslatedText namespace="common" id="showing" /> {(page - 1) * 10 + 1}-
            {Math.min(page * 10, totalExpenses)} <TranslatedText namespace="common" id="of" />{" "}
            {totalExpenses} <TranslatedText namespace="expenses" id="expenses" />
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              <TranslatedText namespace="common" id="previous" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              <TranslatedText namespace="common" id="next" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
