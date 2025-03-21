"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowUpRight, ArrowDownRight, Calendar, User, DollarSign, CreditCard, FileText, CreditCard as CreditCardIcon } from "lucide-react";
import { PaymentHistory } from "@/components/payments/payment-history";
import { useLanguage } from "@/components/language/language-provider";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface TransactionItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

interface TransactionDetailsProps {
  transaction: {
    id: string;
    type: "PURCHASE" | "SALE" | "ADJUSTMENT";
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    total: number;
    amountPaid: number;
    remainingAmount: number;
    paymentMethod?: "CASH" | "BANK_TRANSFER" | "CHECK" | null;
    reference?: string | null;
    notes?: string | null;
    paymentDueDate?: string | null;
    createdAt: string;
    updatedAt: string;
    client?: {
      id: string;
      name: string;
    } | null;
    supplier?: {
      id: string;
      name: string;
    } | null;
    items: TransactionItem[];
  };
  onClose: () => void;
}

export function TransactionDetails({ transaction, onClose }: TransactionDetailsProps) {
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [transactionData, setTransactionData] = useState(transaction);

  // Refresh transaction data when component mounts
  useEffect(() => {
    refreshTransactionData();
  }, [transaction.id]);

  // Refresh transaction data when payments are updated
  const refreshTransactionData = async () => {
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`);
      if (!response.ok) {
        throw new Error("Failed to refresh transaction data");
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setTransactionData(data.data);
      } else {
        console.error("Unexpected transaction data structure:", data);
      }
    } catch (error) {
      console.error("Error refreshing transaction data:", error);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (transaction.status === status) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update transaction status");
      }

      toast.success(language === "ar" ? "تم تحديث حالة المعاملة بنجاح" : "Transaction status updated successfully");
      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error updating transaction status:", error);
      toast.error(error instanceof Error ? error.message : (language === "ar" ? "فشل في تحديث حالة المعاملة" : "Failed to update transaction status"));
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getPaymentMethodLabel = (method: string | null | undefined) => {
    if (!method) return language === "ar" ? "غير محدد" : "Not specified";
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {transaction.type === "PURCHASE" ? (
              <ArrowDownRight className="mr-2 h-5 w-5 text-blue-600" />
            ) : (
              <ArrowUpRight className="mr-2 h-5 w-5 text-green-600" />
            )}
            {transaction.type === "PURCHASE" 
              ? (language === "ar" ? "تفاصيل الشراء" : "Purchase Details") 
              : (language === "ar" ? "تفاصيل البيع" : "Sale Details")}
          </DialogTitle>
          <DialogDescription>
            {language === "ar" ? `رقم المعاملة: ${transaction.id}` : `Transaction ID: ${transaction.id}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "ar" ? "معلومات المعاملة" : "Transaction Info"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {language === "ar" ? `التاريخ: ${formatDate(transaction.createdAt)}` : `Date: ${formatDate(transaction.createdAt)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {transaction.type === "PURCHASE" 
                      ? (language === "ar" ? "المورد: " : "Supplier: ")
                      : (language === "ar" ? "العميل: " : "Client: ")}
                    {transaction.type === "PURCHASE"
                      ? transaction.supplier?.name || "N/A"
                      : transaction.client?.name || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "ar" ? "معلومات الدفع" : "Payment Info"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {language === "ar" 
                      ? `المجموع: ${transaction.total.toFixed(2)} درهم` 
                      : `Total: DH ${transaction.total.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {language === "ar" 
                      ? `المدفوع: ${(transactionData?.amountPaid || 0).toFixed(2)} درهم` 
                      : `Paid: DH ${(transactionData?.amountPaid || 0).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className={`text-sm ${(transactionData?.remainingAmount || 0) > 0 ? "text-destructive" : ""}`}>
                    {language === "ar" 
                      ? `المتبقي: ${(transactionData?.remainingAmount || 0).toFixed(2)} درهم` 
                      : `Remaining: DH ${(transactionData?.remainingAmount || 0).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {language === "ar" 
                      ? `طريقة الدفع: ${getPaymentMethodLabel(transaction.paymentMethod)}` 
                      : `Payment Method: ${getPaymentMethodLabel(transaction.paymentMethod)}`}
                  </span>
                </div>
                {transaction.paymentDueDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {language === "ar" 
                        ? `تاريخ استحقاق الدفع: ${formatDate(transaction.paymentDueDate)}` 
                        : `Payment Due Date: ${formatDate(transaction.paymentDueDate)}`}
                    </span>
                  </div>
                )}
                {transaction.reference && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {language === "ar" ? `المرجع: ${transaction.reference}` : `Reference: ${transaction.reference}`}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "العناصر" : "Items"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase bg-muted/50">
                    <tr>
                      <th className={`px-4 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {language === "ar" ? "المنتج" : "Product"}
                      </th>
                      <th className={`px-4 py-2 ${isRTL ? 'text-left' : 'text-right'}`}>
                        {language === "ar" ? "الكمية" : "Quantity"}
                      </th>
                      <th className={`px-4 py-2 ${isRTL ? 'text-left' : 'text-right'}`}>
                        {language === "ar" ? "السعر" : "Price"}
                      </th>
                      <th className={`px-4 py-2 ${isRTL ? 'text-left' : 'text-right'}`}>
                        {language === "ar" ? "المجموع" : "Total"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="px-4 py-2">{item.product.name}</td>
                        <td className="px-4 py-2 text-right">
                          {item.quantity} {item.product.unit}
                        </td>
                        <td className={`px-4 py-2 ${isRTL ? 'text-left' : 'text-right'}`}>
                          {language === "ar" ? `${item.price.toFixed(2)} درهم` : `DH ${item.price.toFixed(2)}`}
                        </td>
                        <td className={`px-4 py-2 ${isRTL ? 'text-left' : 'text-right'}`}>
                          {language === "ar" 
                            ? `${(item.quantity * item.price).toFixed(2)} درهم` 
                            : `DH ${(item.quantity * item.price).toFixed(2)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-medium">
                      <td colSpan={3} className={`px-4 py-2 ${isRTL ? 'text-left' : 'text-right'}`}>
                        {language === "ar" ? "المجموع" : "Total"}
                      </td>
                      <td className={`px-4 py-2 ${isRTL ? 'text-left' : 'text-right'}`}>
                        {language === "ar" 
                          ? `${transaction.total.toFixed(2)} درهم` 
                          : `DH ${transaction.total.toFixed(2)}`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {transaction.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "ar" ? "ملاحظات" : "Notes"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{transaction.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCardIcon className="h-4 w-4" />
                  {language === "ar" ? "إدارة الدفع" : "Payment Management"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentHistory
                transactionId={transaction.id}
                clientId={transaction.client?.id}
                remainingAmount={transactionData?.remainingAmount || 0}
                onPaymentUpdate={refreshTransactionData}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4">
            {transactionData.status === "PENDING" && (
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {language === "ar" ? "تحديث الحالة" : "Update Status"}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange("COMPLETED")}
                      disabled={isUpdating}
                    >
                      {language === "ar" ? "تعيين كمكتمل" : "Mark as Completed"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => handleStatusChange("CANCELLED")}
                      disabled={isUpdating}
                    >
                      {language === "ar" ? "إلغاء المعاملة" : "Cancel Transaction"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              {language === "ar" ? "إغلاق" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
