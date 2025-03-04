"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { clientFormSchema } from "@/lib/validations";
import { TranslatedText } from "@/components/language/translated-text";
import { useLanguage } from "@/components/language/language-provider";

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  initialData?: ClientFormData & { id: string; balance?: number };
  onSuccess?: () => void;
}

export function ClientForm({ initialData, onSuccess }: ClientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { language, isRTL } = useLanguage();

  // Log the initialData to see what's being passed to the form
  console.log("Client Form initialData:", initialData);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: initialData || {
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      totalDue: 0,
      amountPaid: 0,
    },
  });

  // Force reset the form when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log("Resetting form with initialData:", initialData);
      form.reset(initialData);
    }
  }, [initialData, form]);

  // Calculate balance whenever totalDue or amountPaid changes
  const totalDue = form.watch("totalDue") || 0;
  const amountPaid = form.watch("amountPaid") || 0;
  const balance = totalDue - amountPaid;

  const onSubmit = async (data: ClientFormData) => {
    setIsLoading(true);
    try {
      const url = initialData
        ? `/api/clients/${initialData.id}`
        : "/api/clients";
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
        throw new Error(error.error || "Failed to save client");
      }

      toast.success(
        language === "ar" 
          ? `تم ${initialData ? "تحديث" : "إنشاء"} العميل بنجاح` 
          : `Client ${initialData ? "updated" : "created"} successfully`
      );
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/clients");
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : language === "ar" 
            ? "فشل في حفظ العميل" 
            : "Failed to save client"
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
                  placeholder={language === "ar" ? "اسم العميل" : "Client name"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <TranslatedText namespace="common" id="email" /> 
                ({language === "ar" ? "اختياري" : "Optional"})
              </FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="client@example.com" 
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
                  placeholder={language === "ar" ? "عنوان العميل" : "Client address"}
                  className="resize-none"
                  {...field}
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
              <FormLabel>
                <TranslatedText namespace="common" id="notes" /> 
                ({language === "ar" ? "اختياري" : "Optional"})
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={language === "ar" ? "ملاحظات إضافية حول العميل" : "Additional notes about the client"}
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="totalDue"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="clients" id="totalDue" /></FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground`}>DH</span>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="0.00" 
                      className={isRTL ? 'pr-9' : 'pl-9'}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                      value={field.value === undefined ? "" : field.value}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amountPaid"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="clients" id="amountPaid" /></FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground`}>DH</span>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="0.00" 
                      className={isRTL ? 'pr-9' : 'pl-9'}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                      value={field.value === undefined ? "" : field.value}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel><TranslatedText namespace="clients" id="balance" /></FormLabel>
            <div className="relative">
              <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground`}>DH</span>
              <div className={`h-10 ${isRTL ? 'pr-9' : 'pl-9'} py-2 rounded-md border border-input bg-background text-sm ring-offset-background flex items-center`}>
                <span className={balance > 0 ? "text-destructive" : ""}>
                  {balance.toFixed(2)}
                </span>
              </div>
            </div>
          </FormItem>
        </div>

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
