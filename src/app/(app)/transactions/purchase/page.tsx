import { Suspense } from "react";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionFormSkeleton } from "@/components/transactions/loading";

export default function PurchaseTransactionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Record Purchase</h1>
        <p className="text-muted-foreground">Record a new purchase from a supplier</p>
      </div>
      
      <Suspense fallback={<TransactionFormSkeleton />}>
        <TransactionForm type="PURCHASE" />
      </Suspense>
    </div>
  );
}
