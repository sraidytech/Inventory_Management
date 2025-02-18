import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

const transactions = [
  {
    id: "1",
    type: "Purchase",
    date: "2024-02-18",
    supplier: "Supplier Co Ltd",
    amount: 2499.99,
    status: "Completed",
    items: 5
  },
  {
    id: "2",
    type: "Sale",
    date: "2024-02-17",
    customer: "Tech Store Inc",
    amount: 1299.99,
    status: "Completed",
    items: 3
  },
  {
    id: "3",
    type: "Purchase",
    date: "2024-02-16",
    supplier: "Tech Supplies Inc",
    amount: 899.99,
    status: "Pending",
    items: 2
  }
  // Add more sample transactions as needed
]

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Track purchases and sales</p>
        </div>
        <div className="space-x-2">
          <Button variant="outline">
            <ArrowDownRight className="mr-2 h-4 w-4" />
            Record Purchase
          </Button>
          <Button>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Record Sale
          </Button>
        </div>
      </div>
      
      <Card className="p-6">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Party</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="bg-white border-b">
                  <td className="px-6 py-4">{transaction.date}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center ${
                      transaction.type === "Purchase" 
                        ? "text-blue-600" 
                        : "text-green-600"
                    }`}>
                      {transaction.type === "Purchase" ? (
                        <ArrowDownRight className="mr-1 h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="mr-1 h-4 w-4" />
                      )}
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {transaction.supplier || transaction.customer}
                  </td>
                  <td className="px-6 py-4">{transaction.items}</td>
                  <td className="px-6 py-4 font-medium">
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      transaction.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm">View Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
