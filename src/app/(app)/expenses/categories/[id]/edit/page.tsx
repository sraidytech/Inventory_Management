"use client";

import { ExpenseCategoryForm } from "@/components/expenses/expense-category-form";
import { TranslatedText } from "@/components/language/translated-text";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/components/language/language-provider";

interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditExpenseCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch(`/api/expense-categories/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch expense category");
        }
        const data = await response.json();
        setCategory(data.data);
      } catch (error) {
        console.error("Error fetching expense category:", error);
        toast.error(
          language === "ar"
            ? "فشل في تحميل فئة المصاريف"
            : "Failed to load expense category"
        );
        router.push("/expenses");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchCategory();
    }
  }, [params.id, router, language]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          <TranslatedText namespace="expenses" id="categories.edit" />
        </h1>
        <p className="text-muted-foreground">
          <TranslatedText namespace="expenses" id="categories.editDescription" />
        </p>
      </div>

      <ExpenseCategoryForm
        initialData={{
          id: category.id,
          name: category.name,
          description: category.description || "",
        }}
      />
    </div>
  );
}
