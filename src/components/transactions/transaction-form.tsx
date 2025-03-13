"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { transactionFormSchema } from "@/lib/validations";
import { useCategoriesAndSuppliers } from "@/hooks/use-categories-and-suppliers";
import { TranslatedText } from "@/components/language/translated-text";
import { useLanguage } from "@/components/language/language-provider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type TransactionFormData = z.infer<typeof transactionFormSchema>;

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface TransactionFormProps {
  type: "PURCHASE" | "SALE";
  onSuccess?: () => void;
}

export function TransactionForm({ type, onSuccess }: TransactionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const { suppliers } = useCategoriesAndSuppliers();
  const { language, isRTL } = useLanguage();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type,
      status: "PENDING",
      total: 0,
      amountPaid: 0,
      items: [{ productId: "", quantity: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculate total whenever items change
  const items = form.watch("items");
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  useEffect(() => {
    form.setValue("total", total);
  }, [form, total]);

  // Calculate remaining amount whenever total or amountPaid changes
  const amountPaid = form.watch("amountPaid");
  const remainingAmount = total - amountPaid;

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        
        console.log("Products API response:", data);
        
        // The API now returns { success: true, data: { items: [...], metadata: {...} } }
        if (data.success && data.data && data.data.items && Array.isArray(data.data.items)) {
          setProducts(data.data.items);
        } else {
          console.error("Unexpected products data structure:", data);
          toast.error(language === "ar" ? "فشل في تحميل المنتجات: تنسيق بيانات غير متوقع" : "Failed to load products: Unexpected data format");
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error(language === "ar" ? "فشل في تحميل المنتجات" : "Failed to load products");
      }
    };

    fetchProducts();
  }, [language]);

  // Fetch clients for SALE transactions
  useEffect(() => {
    if (type === "SALE") {
      const fetchClients = async () => {
        try {
          const response = await fetch("/api/clients");
          if (!response.ok) throw new Error("Failed to fetch clients");
          const data = await response.json();
          
          console.log("Clients API response:", data);
          
          // The API now returns { success: true, data: { items: [...], metadata: {...} } }
          if (data.success && data.data && data.data.items && Array.isArray(data.data.items)) {
            setClients(data.data.items);
          } else {
            console.error("Unexpected clients data structure:", data);
            toast.error(language === "ar" ? "فشل في تحميل العملاء: تنسيق بيانات غير متوقع" : "Failed to load clients: Unexpected data format");
          }
        } catch (error) {
          console.error("Error fetching clients:", error);
          toast.error(language === "ar" ? "فشل في تحميل العملاء" : "Failed to load clients");
        }
      };

      fetchClients();
    }
  }, [type, language]);

  const onSubmit = async (data: TransactionFormData) => {
    setIsLoading(true);
    try {
      // Validate required fields based on transaction type
      if (type === "SALE" && !data.clientId) {
        toast.error(language === "ar" ? "العميل مطلوب لمعاملات البيع" : "Client is required for sale transactions");
        setIsLoading(false);
        return;
      }
      
      if (type === "PURCHASE" && !data.supplierId) {
        toast.error(language === "ar" ? "المورد مطلوب لمعاملات الشراء" : "Supplier is required for purchase transactions");
        setIsLoading(false);
        return;
      }
      
      // Validate items
      if (!data.items || data.items.length === 0) {
        toast.error(language === "ar" ? "مطلوب عنصر واحد على الأقل" : "At least one item is required");
        setIsLoading(false);
        return;
      }
      
      for (const item of data.items) {
        if (!item.productId) {
          toast.error(language === "ar" ? "المنتج مطلوب لجميع العناصر" : "Product is required for all items");
          setIsLoading(false);
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          toast.error(language === "ar" ? "يجب أن تكون الكمية موجبة لجميع العناصر" : "Quantity must be positive for all items");
          setIsLoading(false);
          return;
        }
        if (item.price < 0) {
          toast.error(language === "ar" ? "يجب أن يكون السعر غير سالب لجميع العناصر" : "Price must be non-negative for all items");
          setIsLoading(false);
          return;
        }
      }
      
      // Prepare data for submission
      const submissionData = {
        ...data,
        remainingAmount: total - data.amountPaid,
        // Convert paymentDueDate to ISO string if it exists
        paymentDueDate: data.paymentDueDate ? new Date(data.paymentDueDate).toISOString() : undefined
      };
      
      console.log("Submitting transaction data:", submissionData);
      
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Transaction API error response:", errorData);
        throw new Error(errorData.error || "Failed to create transaction");
      }

      toast.success(
        language === "ar" 
          ? `تم تسجيل ${type === "PURCHASE" ? "الشراء" : "البيع"} بنجاح` 
          : `${type === "PURCHASE" ? "Purchase" : "Sale"} recorded successfully`
      );
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/transactions");
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : language === "ar" 
            ? "فشل في إنشاء المعاملة" 
            : "Failed to create transaction"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.price`, product.price);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Party Selection (Client or Supplier) */}
          {type === "SALE" ? (
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel><TranslatedText namespace="common" id="client" /></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "ar" ? "اختر عميلاً" : "Select a client"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel><TranslatedText namespace="common" id="supplier" /></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "ar" ? "اختر مورداً" : "Select a supplier"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="common" id="status" /></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "ar" ? "اختر الحالة" : "Select status"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PENDING">
                      <TranslatedText namespace="transactions" id="status.pending" />
                    </SelectItem>
                    <SelectItem value="COMPLETED">
                      <TranslatedText namespace="transactions" id="status.completed" />
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Payment Information */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="amountPaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><TranslatedText namespace="transactions" id="amountPaid" /></FormLabel>
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
                            const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><TranslatedText namespace="transactions" id="paymentMethod" /></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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

              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <TranslatedText namespace="transactions" id="reference" /> 
                      ({language === "ar" ? "اختياري" : "Optional"})
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={language === "ar" ? "رقم الشيك أو مرجع التحويل" : "Check number or transfer reference"}
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
                name="paymentDueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      <TranslatedText namespace="transactions" id="paymentDueDate" />
                      ({language === "ar" ? "اختياري" : "Optional"})
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(typeof field.value === 'string' ? new Date(field.value) : field.value, "PPP")
                            ) : (
                              <span>{language === "ar" ? "اختر تاريخ" : "Pick a date"}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? (typeof field.value === 'string' ? new Date(field.value) : field.value) : undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              <TranslatedText namespace="transactions" id="items" />
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ productId: "", quantity: 1, price: 0 })}
            >
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              <TranslatedText namespace="transactions" id="addItem" />
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-5">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel><TranslatedText namespace="common" id="product" /></FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleProductChange(index, value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={language === "ar" ? "اختر منتجاً" : "Select a product"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel><TranslatedText namespace="common" id="quantity" /></FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? 1 : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel><TranslatedText namespace="common" id="price" /></FormLabel>
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
                                  const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                  field.onChange(value);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-1 flex items-end justify-center pb-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Notes */}
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
                  placeholder={language === "ar" ? "أضف أي ملاحظات إضافية هنا" : "Add any additional notes here"}
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground"><TranslatedText namespace="common" id="total" /></span>
                <span className="font-medium">DH {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground"><TranslatedText namespace="transactions" id="amountPaid" /></span>
                <span className="font-medium">DH {amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground"><TranslatedText namespace="transactions" id="remaining" /></span>
                <span className={`font-medium ${remainingAmount > 0 ? "text-destructive" : ""}`}>
                  DH {remainingAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

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
              : (language === "ar" ? "حفظ المعاملة" : "Save Transaction")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
