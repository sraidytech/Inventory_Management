"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { expenseFormSchema } from "@/lib/validations";
import { TranslatedText } from "@/components/language/translated-text";
import { useLanguage } from "@/components/language/language-provider";

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface ExpenseCategory {
  id: string;
  name: string;
}

interface ExpenseFormProps {
  initialData?: ExpenseFormData & { id: string };
  onSuccess?: () => void;
}

export function ExpenseForm({ initialData, onSuccess }: ExpenseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const { language, isRTL } = useLanguage();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: initialData || {
      amount: 0,
      description: "",
      status: "COMPLETED",
      paymentMethod: "CASH",
      reference: "",
      notes: "",
      categoryId: "",
    },
  });

  // Fetch expense categories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsFetchingCategories(true);
      try {
        const response = await fetch("/api/expense-categories?limit=100");
        if (!response.ok) {
          throw new Error("Failed to fetch expense categories");
        }
        const data = await response.json();
        setCategories(data.categories);
      } catch (error) {
        console.error("Error fetching expense categories:", error);
        toast.error(
          language === "ar"
            ? "فشل في تحميل فئات المصاريف"
            : "Failed to load expense categories"
        );
      } finally {
        setIsFetchingCategories(false);
      }
    };

    fetchCategories();
  }, [language]);

  const onSubmit = async (data: ExpenseFormData) => {
    setIsLoading(true);
    try {
      const url = initialData
        ? `/api/expenses/${initialData.id}`
        : "/api/expenses";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save expense");
      }

      toast.success(
        language === "ar" 
          ? `تم ${initialData ? "تحديث" : "إنشاء"} المصروف بنجاح` 
          : `Expense ${initialData ? "updated" : "created"} successfully`
      );
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/expenses");
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : language === "ar" 
            ? "فشل في حفظ المصروف" 
            : "Failed to save expense"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="expenses" id="amount" /></FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="expenses" id="category" /></FormLabel>
                <Select
                  disabled={isFetchingCategories}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={
                          isFetchingCategories
                            ? language === "ar"
                              ? "جاري التحميل..."
                              : "Loading..."
                            : language === "ar"
                              ? "اختر فئة"
                              : "Select a category"
                        } 
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel><TranslatedText namespace="common" id="description" /></FormLabel>
              <FormControl>
                <Textarea
                  placeholder={language === "ar" ? "وصف المصروف" : "Expense description"}
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="common" id="status" /></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "ar" ? "اختر الحالة" : "Select status"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="expenses" id="paymentMethod" /></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "ar" ? "اختر طريقة الدفع" : "Select payment method"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CASH">
                      <TranslatedText namespace="transactions" id="paymentMethods.cash" />
                    </SelectItem>
                    <SelectItem value="BANK_TRANSFER">
                      <TranslatedText namespace="transactions" id="paymentMethods.bankTransfer" />
                    </SelectItem>
                    <SelectItem value="CHECK">
                      <TranslatedText namespace="transactions" id="paymentMethods.check" />
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel><TranslatedText namespace="expenses" id="reference" /></FormLabel>
              <FormControl>
                <Input 
                  placeholder={language === "ar" ? "رقم الشيك أو مرجع التحويل البنكي" : "Check number or bank transfer reference"} 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel><TranslatedText namespace="common" id="notes" /></FormLabel>
              <FormControl>
                <Textarea
                  placeholder={language === "ar" ? "ملاحظات إضافية" : "Additional notes"}
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className={`flex justify-end gap-2 ${isRTL ? 'space-x-reverse' : ''}`}>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            <TranslatedText namespace="common" id="cancel" />
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading 
              ? (language === "ar" ? "جاري الحفظ..." : "Saving...") 
              : initialData 
                ? (language === "ar" ? "تحديث" : "Update") 
                : (language === "ar" ? "إنشاء" : "Create")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
