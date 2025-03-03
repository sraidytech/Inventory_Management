"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Search, ArrowUp, ArrowDown } from "lucide-react";

interface Client {
  id: string;
  name: string;
  totalDue: number;
  amountPaid: number;
  balance: number;
  lastPaymentDate?: string;
  creditScore?: number;
}

interface CreditManagementTableProps {
  clients: Client[];
}

export function CreditManagementTable({ clients }: CreditManagementTableProps) {
  const [sortField, setSortField] = useState<keyof Client>("balance");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");

  // Sort clients based on current sort field and direction
  const sortedClients = [...clients].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    // Handle string comparison
    const aString = String(aValue || '');
    const bString = String(bValue || '');
    return sortDirection === "asc" 
      ? aString.localeCompare(bString)
      : bString.localeCompare(aString);
  });

  // Filter clients based on search term
  const filteredClients = sortedClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle sort change
  const handleSort = (field: keyof Client) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to descending for new sort field
    }
  };

  // Calculate credit health score (simple example)
  const getCreditHealthScore = (client: Client) => {
    if (client.creditScore) return client.creditScore;
    
    // Simple calculation based on payment ratio
    const paymentRatio = client.amountPaid / (client.totalDue || 1);
    return Math.min(Math.round(paymentRatio * 100), 100);
  };

  // Get color based on credit health score
  const getCreditHealthColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100";
    if (score >= 50) return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100";
    return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100";
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `DH ${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[200px]">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Client Name
                    {sortField === "name" && (
                      sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                    {sortField !== "name" && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                  </Button>
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort("totalDue")}
                    className="flex items-center gap-1 p-0 h-auto font-medium ml-auto"
                  >
                    Total Due
                    {sortField === "totalDue" && (
                      sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                    {sortField !== "totalDue" && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                  </Button>
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort("amountPaid")}
                    className="flex items-center gap-1 p-0 h-auto font-medium ml-auto"
                  >
                    Amount Paid
                    {sortField === "amountPaid" && (
                      sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                    {sortField !== "amountPaid" && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                  </Button>
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort("balance")}
                    className="flex items-center gap-1 p-0 h-auto font-medium ml-auto"
                  >
                    Balance
                    {sortField === "balance" && (
                      sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                    {sortField !== "balance" && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                  </Button>
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Last Payment</th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Credit Health</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr className="border-b">
                  <td colSpan={6} className="p-4 align-middle text-center py-6 text-muted-foreground">
                    No clients with outstanding balance found
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const creditScore = getCreditHealthScore(client);
                  const healthColor = getCreditHealthColor(creditScore);
                  
                  return (
                    <tr key={client.id} className="border-b">
                      <td className="p-4 align-middle font-medium">{client.name}</td>
                      <td className="p-4 align-middle text-right">{formatCurrency(client.totalDue)}</td>
                      <td className="p-4 align-middle text-right">{formatCurrency(client.amountPaid)}</td>
                      <td className="p-4 align-middle text-right font-medium">{formatCurrency(client.balance)}</td>
                      <td className="p-4 align-middle text-center">{formatDate(client.lastPaymentDate)}</td>
                      <td className="p-4 align-middle text-center">
                        <div className="flex justify-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${healthColor}`}>
                            {creditScore}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
