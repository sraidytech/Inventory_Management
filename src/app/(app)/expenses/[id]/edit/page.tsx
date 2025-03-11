"use client";

import { ExpenseForm } from "@/components/expenses/expense-form";
import { TranslatedText } from "@/components/language/translated-text";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/components/language/language-provider";

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
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditExpensePage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const response = await fetch(`/api/expenses/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch expense");
        }
        const data = await response.json();
        setExpense(data.data);
      } catch (error) {
        console.error("Error fetching expense:", error);
        toast.error(
          language === "ar"
            ? "فشل في تحميل المصروف"
            : "Failed to load expense"
        );
        router.push("/expenses");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchExpense();
    }
  }, [params.id, router, language]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!expense) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          <TranslatedText namespace="expenses" id="edit" />
        </h1>
        <p className="text-muted-foreground">
          <TranslatedText namespace="expenses" id="editDescription" />
        </p>
      </div>

      <ExpenseForm
        initialData={{
          id: expense.id,
          amount: expense.amount,
          description: expense.description,
          status: expense.status,
          paymentMethod: expense.paymentMethod,
          reference: expense.reference || "",
          notes: expense.notes || "",
          categoryId: expense.categoryId,
        }}
      />
    </div>
  );
}
