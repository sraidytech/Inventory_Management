"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUpRight, ArrowDownRight, Calendar, User, DollarSign, CreditCard, FileText } from "lucide-react";

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>(
    transaction.paymentMethod || undefined
  );
  const [amountPaid, setAmountPaid] = useState<number>(transaction.amountPaid);
  const [reference, setReference] = useState<string | undefined>(
    transaction.reference || undefined
  );

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

      toast.success("Transaction status updated successfully");
      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error updating transaction status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update transaction status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: transaction.status,
          amountPaid,
          paymentMethod,
          reference,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update payment");
      }

      toast.success("Payment updated successfully");
      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update payment");
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
    if (!method) return "Not specified";
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
            {transaction.type === "PURCHASE" ? "Purchase" : "Sale"} Details
          </DialogTitle>
          <DialogDescription>
            Transaction ID: {transaction.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Transaction Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Date: {formatDate(transaction.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {transaction.type === "PURCHASE" ? "Supplier: " : "Client: "}
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
                <CardTitle className="text-sm font-medium">Payment Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total: DH {transaction.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Paid: DH {transaction.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className={`text-sm ${transaction.remainingAmount > 0 ? "text-destructive" : ""}`}>
                    Remaining: DH {transaction.remainingAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Payment Method: {getPaymentMethodLabel(transaction.paymentMethod)}
                  </span>
                </div>
                {transaction.reference && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Reference: {transaction.reference}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-right">Quantity</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="px-4 py-2">{item.product.name}</td>
                        <td className="px-4 py-2 text-right">
                          {item.quantity} {item.product.unit}
                        </td>
                        <td className="px-4 py-2 text-right">DH {item.price.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">
                          DH {(item.quantity * item.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-medium">
                      <td colSpan={3} className="px-4 py-2 text-right">Total</td>
                      <td className="px-4 py-2 text-right">DH {transaction.total.toFixed(2)}</td>
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
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{transaction.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-4">
            {transaction.status === "PENDING" && (
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Update Status</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange("COMPLETED")}
                      disabled={isUpdating}
                    >
                      Mark as Completed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => handleStatusChange("CANCELLED")}
                      disabled={isUpdating}
                    >
                      Cancel Transaction
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Update Payment</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                  >
                    {showPaymentForm ? "Hide Payment Form" : "Update Payment"}
                  </Button>
                </div>

                {showPaymentForm && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="amountPaid">Amount Paid</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">DH</span>
                            <Input
                              id="amountPaid"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-9"
                              value={amountPaid}
                              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="paymentMethod">Payment Method</Label>
                          <Select
                            value={paymentMethod}
                            onValueChange={setPaymentMethod}
                          >
                            <SelectTrigger id="paymentMethod">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CASH">Cash</SelectItem>
                              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                              <SelectItem value="CHECK">Check</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reference">Reference (Optional)</Label>
                          <Input
                            id="reference"
                            placeholder="Check number or transfer reference"
                            value={reference || ""}
                            onChange={(e) => setReference(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button
                          size="sm"
                          onClick={handlePaymentUpdate}
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Updating..." : "Update Payment"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
