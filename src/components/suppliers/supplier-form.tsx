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
import { supplierFormSchema } from "@/lib/validations";
import { TranslatedText } from "@/components/language/translated-text";
import { useLanguage } from "@/components/language/language-provider";

type SupplierFormData = z.infer<typeof supplierFormSchema>;

interface SupplierFormProps {
  initialData?: SupplierFormData & { id: string };
  onSuccess?: () => void;
}

export function SupplierForm({ initialData, onSuccess }: SupplierFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { language, isRTL } = useLanguage();

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: initialData || {
      name: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    setIsLoading(true);
    try {
      const url = initialData
        ? `/api/suppliers/${initialData.id}`
        : "/api/suppliers";
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
        throw new Error(error.error || "Failed to save supplier");
      }

      toast.success(
        language === "ar" 
          ? `تم ${initialData ? "تحديث" : "إنشاء"} المورد بنجاح` 
          : `Supplier ${initialData ? "updated" : "created"} successfully`
      );
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/suppliers");
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : language === "ar" 
            ? "فشل في حفظ المورد" 
            : "Failed to save supplier"
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
                  placeholder={language === "ar" ? "اسم المورد" : "Supplier name"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel><TranslatedText namespace="common" id="phone" /></FormLabel>
              <FormControl>
                <Input placeholder="+1 234 567 890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel><TranslatedText namespace="common" id="address" /></FormLabel>
              <FormControl>
                <Textarea
                  placeholder={language === "ar" ? "عنوان المورد" : "Supplier address"}
                  className="resize-none"
                  {...field}
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
