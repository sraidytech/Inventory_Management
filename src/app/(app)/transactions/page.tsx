import { Suspense } from "react";
import { TransactionsClient } from "./transactions-client";
import { TransactionsTableSkeleton } from "@/components/transactions/loading";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Track purchases and sales</p>
        </div>
      </div>
      
      <Suspense fallback={<TransactionsTableSkeleton />}>
        <TransactionsClient />
      </Suspense>
    </div>
  );
}
