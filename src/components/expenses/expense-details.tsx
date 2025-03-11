"use client";

import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/components/language/language-provider";
import { TranslatedText } from "@/components/language/translated-text";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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

interface ExpenseDetailsProps {
  expense: Expense;
  onClose: () => void;
}

export function ExpenseDetails({ expense, onClose }: ExpenseDetailsProps) {
  const { language } = useLanguage();

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

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH":
        return language === "ar" ? "نقدًا" : "Cash";
      case "BANK_TRANSFER":
        return language === "ar" ? "تحويل بنكي" : "Bank Transfer";
      case "CHECK":
        return language === "ar" ? "شيك" : "Check";
      default:
        return method;
    }
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>
          <TranslatedText namespace="expenses" id="expenseDetails" />
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              <TranslatedText namespace="expenses" id="amount" />
            </h3>
            <p className="text-lg font-semibold">DH {expense.amount.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              <TranslatedText namespace="common" id="date" />
            </h3>
            <p>{formatDate(expense.createdAt)}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            <TranslatedText namespace="expenses" id="category" />
          </h3>
          <p>{expense.category.name}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            <TranslatedText namespace="common" id="description" />
          </h3>
          <p>{expense.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              <TranslatedText namespace="common" id="status" />
            </h3>
            <p className={getStatusColor(expense.status)}>
              <TranslatedText namespace="expenses" id={`status.${expense.status.toLowerCase()}`} />
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              <TranslatedText namespace="expenses" id="paymentMethod" />
            </h3>
            <p>{getPaymentMethodLabel(expense.paymentMethod)}</p>
          </div>
        </div>

        {expense.reference && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              <TranslatedText namespace="expenses" id="reference" />
            </h3>
            <p>{expense.reference}</p>
          </div>
        )}

        {expense.notes && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              <TranslatedText namespace="common" id="notes" />
            </h3>
            <p className="whitespace-pre-wrap">{expense.notes}</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose}>
            <TranslatedText namespace="common" id="close" />
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
