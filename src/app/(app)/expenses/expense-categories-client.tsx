"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TranslatedText } from "@/components/language/translated-text";
import { useLanguage } from "@/components/language/language-provider";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { PlusCircle, Search, MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function ExpenseCategoriesClient() {
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, [page, searchTerm]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      let url = `/api/expense-categories?page=${page}&limit=10`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch expense categories");
      }
      
      const data = await response.json();
      setCategories(data.categories);
      setTotalPages(data.totalPages || 1);
      setTotalCategories(data.total || 0);
    } catch (error) {
      console.error("Error fetching expense categories:", error);
      toast.error(
        language === "ar"
          ? "فشل في تحميل فئات المصاريف"
          : "Failed to load expense categories"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === "ar" ? "هل أنت متأكد من حذف هذه الفئة؟" : "Are you sure you want to delete this category?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/expense-categories/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete expense category");
      }
      
      toast.success(
        language === "ar"
          ? "تم حذف فئة المصاريف بنجاح"
          : "Expense category deleted successfully"
      );
      
      fetchCategories();
    } catch (error) {
      console.error("Error deleting expense category:", error);
      toast.error(
        language === "ar"
          ? "فشل في حذف فئة المصاريف"
          : "Failed to delete expense category"
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPP", {
      locale: language === "ar" ? ar : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            <TranslatedText namespace="expenses" id="categories.title" />
          </h2>
          <p className="text-muted-foreground">
            <TranslatedText namespace="expenses" id="categories.subtitle" />
          </p>
        </div>
        <Button onClick={() => router.push("/expenses/categories")}>
          <PlusCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          <TranslatedText namespace="expenses" id="categories.addCategory" />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === "ar" ? "البحث عن فئات المصاريف..." : "Search expense categories..."}
            className={`${isRTL ? 'pr-8' : 'pl-8'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <TranslatedText namespace="common" id="name" />
                </TableHead>
                <TableHead>
                  <TranslatedText namespace="common" id="description" />
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
                  <TableCell colSpan={4} className="text-center py-10">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    {language === "ar" ? "لم يتم العثور على فئات مصاريف" : "No expense categories found"}
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || "-"}</TableCell>
                    <TableCell>{formatDate(category.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/expenses/categories/${category.id}/edit`)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            <TranslatedText namespace="common" id="edit" />
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 dark:text-red-400"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            <TranslatedText namespace="common" id="delete" />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!loading && categories.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <TranslatedText namespace="common" id="showing" /> {(page - 1) * 10 + 1}-
            {Math.min(page * 10, totalCategories)} <TranslatedText namespace="common" id="of" />{" "}
            {totalCategories} <TranslatedText namespace="expenses" id="categories.categories" />
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
