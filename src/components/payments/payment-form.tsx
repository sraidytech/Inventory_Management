"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { paymentFormSchema } from "@/lib/validations";

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  status: string;
  transactionId: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentFormProps {
  transactionId: string;
  clientId?: string;
  remainingAmount: number;
  payment?: Payment;
  onClose: (refreshData?: boolean) => void;
}

export function PaymentForm({ transactionId, clientId, remainingAmount, payment, onClose }: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!payment;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: payment?.amount || remainingAmount,
      paymentMethod: (payment?.paymentMethod as "CASH" | "BANK_TRANSFER" | "CHECK" | undefined) || "CASH",
      reference: payment?.reference || "",
      notes: payment?.notes || "",
      transactionId,
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    if (data.amount > remainingAmount && !isEditing) {
      toast.error(`Payment amount cannot exceed remaining amount (DH ${remainingAmount.toFixed(2)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditing 
        ? `/api/payments/${payment.id}`
        : "/api/payments";
      
      const method = isEditing ? "PUT" : "POST";
      
      // Add clientId to the data if provided
      const paymentData = clientId ? { ...data, clientId } : data;
      
      console.log("Sending payment data:", paymentData);
      
      // Use a try-catch block specifically for the fetch operation
      try {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
          cache: "no-store",
        });

        let responseData;
        const responseText = await response.text();
        console.log("Response text:", responseText);
        
        try {
          // Try to parse the response as JSON
          responseData = JSON.parse(responseText);
          console.log("Parsed response data:", responseData);
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          // If we can't parse as JSON, use the raw text
          responseData = { success: false, error: responseText || "Unknown error" };
        }

        if (!response.ok || (responseData && !responseData.success)) {
          const errorMessage = responseData && responseData.error 
            ? responseData.error 
            : `Failed to ${isEditing ? 'update' : 'create'} payment`;
          
          throw new Error(errorMessage);
        }
        
        console.log("Payment success response:", responseData);
        toast.success(`Payment ${isEditing ? 'updated' : 'recorded'} successfully`);
        onClose(true);
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} payment:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} payment`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">DH</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={isEditing ? undefined : remainingAmount}
                    placeholder="0.00"
                    className="pl-9"
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
              <FormLabel>Payment Method</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
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
              <FormLabel>Reference (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Check number or transfer reference"
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
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes here"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Payment" : "Add Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
