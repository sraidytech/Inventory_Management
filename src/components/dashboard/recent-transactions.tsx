import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";

import { TransactionStatus, TransactionType } from "@prisma/client";

interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  total: number;
  createdAt: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions = [] }: RecentTransactionsProps) {
  if (!transactions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest activity in your inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            No recent transactions found
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Latest activity in your inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-full bg-muted">
                  {transaction.type === "SALE" ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500" />
                  ) : transaction.type === "PURCHASE" ? (
                    <ArrowDownIcon className="h-4 w-4 text-blue-500" />
                  ) : (
                    <MinusIcon className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {transaction.type.charAt(0) +
                      transaction.type.slice(1).toLowerCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(transaction.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">
                  {transaction.type === "SALE" ? "+" : "-"}${transaction.total.toFixed(2)}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    transaction.status === "COMPLETED"
                      ? "bg-green-100 text-green-700"
                      : transaction.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {transaction.status.charAt(0) +
                    transaction.status.slice(1).toLowerCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
