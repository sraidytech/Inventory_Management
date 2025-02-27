import { Suspense } from "react";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionFormSkeleton } from "@/components/transactions/loading";

export default function SaleTransactionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Record Sale</h1>
        <p className="text-muted-foreground">Record a new sale to a client</p>
      </div>
      
      <Suspense fallback={<TransactionFormSkeleton />}>
        <TransactionForm type="SALE" />
      </Suspense>
    </div>
  );
}
