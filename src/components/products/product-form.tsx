"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useCategoriesAndSuppliers } from "@/hooks/use-categories-and-suppliers";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import { ProductFormData, productFormSchema } from "@/lib/validations/product";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TranslatedText } from "@/components/language/translated-text";
import { useLanguage } from "@/components/language/language-provider";

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({
  initialData,
  onSubmit,
  isLoading = false,
}: ProductFormProps) {
  const { categories, suppliers, isLoading: isLoadingOptions } = useCategoriesAndSuppliers();
  const { language, isRTL } = useLanguage();
  
  console.log('Initial form data:', initialData);
  const defaultValues: ProductFormData = {
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    sku: initialData?.sku ?? "",
    price: Number(initialData?.price ?? 0),
    quantity: Number(initialData?.quantity ?? 0),
    minQuantity: Number(initialData?.minQuantity ?? 0),
    unit: initialData?.unit ?? "KG",
    categoryId: initialData?.categoryId ?? "",
    supplierId: initialData?.supplierId ?? "",
    image: initialData?.image ?? "",
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  // Log form values for debugging
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log('Form values:', value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ProductFormData) => {
    try {
      setError(null);
      // Ensure all required fields are present and properly formatted
      const formattedData: ProductFormData = {
        name: data.name,
        description: data.description,
        sku: data.sku,
        price: Number(data.price),
        quantity: Number(data.quantity),
        minQuantity: Number(data.minQuantity),
        unit: data.unit || "KG",
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        image: data.image,
      };

      // Validate the data before submitting
      const validatedData = productFormSchema.parse(formattedData);
      console.log('Submitting data:', validatedData);
      
      // Clear any previous errors
      setError(null);
      
      await onSubmit(validatedData);
    } catch (error) {
      console.error("Failed to save product:", error);
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => e.message);
        setError(messages.join(', '));
      } else if (error instanceof Error) {
        // Handle API error responses
        const apiError = error as { error?: string; errors?: string[] };
        if (apiError.errors) {
          setError(apiError.errors.join(', '));
        } else if (apiError.error) {
          setError(apiError.error);
        } else {
          setError(error.message);
        }
      } else {
        setError(language === "ar" ? "فشل في حفظ المنتج" : "Failed to save product");
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="common" id="name" /></FormLabel>
                <FormControl>
                  <Input 
                    placeholder={language === "ar" ? "اسم المنتج" : "Product name"} 
                    {...field} 
                    className={isRTL ? "text-right" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SKU */}
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="products" id="sku" /></FormLabel>
                <FormControl>
                  <Input 
                    placeholder="SKU" 
                    {...field} 
                    className={isRTL ? "text-right" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <TranslatedText namespace="common" id="price" /> 
                  {language === "ar" ? " (درهم)" : " (DH)"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    suffix={language === "ar" ? "درهم" : "DH"}
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : 0;
                      field.onChange(value);
                    }}
                    className={isRTL ? "text-right" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unit Selection */}
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="products" id="unit" /></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || "KG"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "ar" ? "اختر الوحدة" : "Select unit"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="KG"><TranslatedText namespace="products" id="kg" /></SelectItem>
                    <SelectItem value="PIECE"><TranslatedText namespace="products" id="piece" /></SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantity */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="common" id="quantity" /></FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
                    suffix={form.watch("unit") === "KG" 
                      ? (language === "ar" ? "كغ" : "KG") 
                      : form.watch("unit") === "PIECE" 
                        ? (language === "ar" ? "قطعة" : "PIECE") 
                        : form.watch("unit")}
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : 0;
                      field.onChange(value);
                    }}
                    className={isRTL ? "text-right" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Min Quantity */}
          <FormField
            control={form.control}
            name="minQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="products" id="minQuantity" /></FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
                    suffix={form.watch("unit") === "KG" 
                      ? (language === "ar" ? "كغ" : "KG") 
                      : form.watch("unit") === "PIECE" 
                        ? (language === "ar" ? "قطعة" : "PIECE") 
                        : form.watch("unit")}
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : 0;
                      field.onChange(value);
                    }}
                    className={isRTL ? "text-right" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category Selection */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="products" id="category" /></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  disabled={isLoadingOptions}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "ar" ? "اختر الفئة" : "Select category"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                  {Array.isArray(categories) && categories.length > 0 ? (
                    categories.map((category: { id: string; name: string }) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-categories" disabled>
                      {language === "ar" ? "لا توجد فئات متاحة" : "No categories available"}
                    </SelectItem>
                  )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Supplier Selection */}
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel><TranslatedText namespace="products" id="supplier" /></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  disabled={isLoadingOptions}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "ar" ? "اختر المورد" : "Select supplier"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.isArray(suppliers) && suppliers.length > 0 ? (
                      suppliers.map((supplier: { id: string; name: string }) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-suppliers" disabled>
                        {language === "ar" ? "لا يوجد موردين متاحين" : "No suppliers available"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel><TranslatedText namespace="common" id="description" /></FormLabel>
              <FormControl>
                <textarea
                  className={`flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isRTL ? "text-right" : ""}`}
                  placeholder={language === "ar" ? "وصف المنتج" : "Product description"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className={`flex ${isRTL ? 'justify-start space-x-reverse' : 'justify-end space-x-4'}`}>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const defaultValues = {
                name: initialData?.name ?? "",
                description: initialData?.description ?? "",
                sku: initialData?.sku ?? "",
                price: Number(initialData?.price ?? 0),
                quantity: Number(initialData?.quantity ?? 0),
                minQuantity: Number(initialData?.minQuantity ?? 0),
                unit: initialData?.unit ?? "KG",
                categoryId: initialData?.categoryId ?? "",
                supplierId: initialData?.supplierId ?? "",
                image: initialData?.image ?? "",
              };
              form.reset(defaultValues);
              setError(null);
            }}
            disabled={isLoading}
            className={isRTL ? 'ml-4' : 'mr-4'}
          >
            <TranslatedText namespace="common" id="reset" />
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 
              (language === "ar" ? "جاري الحفظ..." : "Saving...") : 
              (language === "ar" ? "حفظ المنتج" : "Save Product")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
