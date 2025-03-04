"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { categoryFormSchema } from "@/lib/validations";
import { TranslatedText } from "@/components/language/translated-text";
import { useLanguage } from "@/components/language/language-provider";

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  initialData?: CategoryFormData & { id: string };
  onSuccess?: () => void;
}

export function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { language, isRTL } = useLanguage();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    setIsLoading(true);
    try {
      const url = initialData
        ? `/api/categories/${initialData.id}`
        : "/api/categories";
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
        throw new Error(error.error || "Failed to save category");
      }

      toast.success(
        language === "ar" 
          ? `تم ${initialData ? "تحديث" : "إنشاء"} الفئة بنجاح` 
          : `Category ${initialData ? "updated" : "created"} successfully`
      );
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/categories");
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : language === "ar" 
            ? "فشل في حفظ الفئة" 
            : "Failed to save category"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel><TranslatedText namespace="common" id="name" /></FormLabel>
              <FormControl>
                <Input 
                  placeholder={language === "ar" ? "اسم الفئة" : "Category name"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel><TranslatedText namespace="common" id="description" /></FormLabel>
              <FormControl>
                <Textarea
                  placeholder={language === "ar" ? "وصف الفئة" : "Category description"}
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
