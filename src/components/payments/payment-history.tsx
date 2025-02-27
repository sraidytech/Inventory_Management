"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, DollarSign, CreditCard, FileText, Calendar } from "lucide-react";
import { PaymentForm } from "./payment-form";

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
  transaction?: {
    id: string;
    type: string;
    total: number;
    status: string;
  };
  client?: {
    id: string;
    name: string;
  };
}

interface PaymentHistoryProps {
  transactionId: string;
  clientId?: string;
  remainingAmount: number;
  onPaymentUpdate?: () => void;
}

export function PaymentHistory({ transactionId, clientId, remainingAmount, onPaymentUpdate }: PaymentHistoryProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch payments when component mounts
  useState(() => {
    fetchPayments();
  });

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/payments?transactionId=${transactionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      
      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data.items)) {
        setPayments(data.data.items);
      } else {
        console.error("Unexpected payment data structure:", data);
        toast.error("Failed to load payments: Unexpected data format");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = () => {
    setShowAddPayment(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete payment");
      }

      toast.success("Payment deleted successfully");
      fetchPayments();
      if (onPaymentUpdate) {
        onPaymentUpdate();
      }
      router.refresh();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete payment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePaymentFormClose = (refreshData: boolean = false) => {
    setShowAddPayment(false);
    setSelectedPayment(null);
    
    if (refreshData) {
      fetchPayments();
      if (onPaymentUpdate) {
        onPaymentUpdate();
      }
      router.refresh();
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH":
        return "Cash";
      case "BANK_TRANSFER":
        return "Bank Transfer";
      case "CHECK":
        return "Check";
      default:
        return method;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Payment History</h3>
        {remainingAmount > 0 && (
          <Button
            size="sm"
            onClick={handleAddPayment}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Payment
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No payment records found</div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <Card key={payment.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">DH {payment.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </span>
                    </div>
                    {payment.reference && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Ref: {payment.reference}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPayment(payment)}
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePayment(payment.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
                {payment.notes && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {payment.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Payment Dialog */}
      {showAddPayment && (
        <Dialog open={showAddPayment} onOpenChange={() => setShowAddPayment(false)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Payment</DialogTitle>
            </DialogHeader>
            <PaymentForm
              transactionId={transactionId}
              clientId={clientId}
              remainingAmount={remainingAmount}
              onClose={handlePaymentFormClose}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Payment Dialog */}
      {selectedPayment && (
        <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Payment</DialogTitle>
            </DialogHeader>
            <PaymentForm
              transactionId={transactionId}
              clientId={clientId}
              remainingAmount={remainingAmount + selectedPayment.amount}
              payment={selectedPayment}
              onClose={handlePaymentFormClose}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
