"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DollarSign, ArrowUpRight, ArrowDownRight, Download } from "lucide-react";
import { PaymentChart } from "@/components/finance/payment-chart";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Define types for jsPDF with autoTable
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

interface FinancialSummary {
  totalSales: number;
  totalPurchases: number;
  totalReceived: number;
  totalPaid: number;
  pendingReceivables: number;
  pendingPayables: number;
  profit: number;
}

interface ClientDebt {
  id: string;
  name: string;
  totalDue: number;
  amountPaid: number;
  balance: number;
  lastPaymentDate?: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  status: string;
  createdAt: string;
  transactionId: string;
  clientId?: string;
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

export default function FinancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("summary");
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalSales: 0,
    totalPurchases: 0,
    totalReceived: 0,
    totalPaid: 0,
    pendingReceivables: 0,
    pendingPayables: 0,
    profit: 0,
  });
  const [clientDebts, setClientDebts] = useState<ClientDebt[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Set active tab from URL if present
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["summary", "receivables", "payments", "reports"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/finance?tab=${value}`, { scroll: false });
  };

  // Fetch financial data
  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  // Initial data fetch
  useEffect(() => {
    // Force a refresh when the component mounts
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      // Fetch financial summary
      const summaryResponse = await fetch(
        `/api/dashboard/stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      if (!summaryResponse.ok) {
        throw new Error("Failed to fetch financial summary");
      }
      const summaryData = await summaryResponse.json();
      
      if (summaryData.success && summaryData.data) {
        setFinancialSummary({
          totalSales: summaryData.data.totalSales || 0,
          totalPurchases: summaryData.data.totalPurchases || 0,
          totalReceived: summaryData.data.totalReceived || 0,
          totalPaid: summaryData.data.totalPaid || 0,
          pendingReceivables: summaryData.data.pendingReceivables || 0,
          pendingPayables: summaryData.data.pendingPayables || 0,
          profit: summaryData.data.profit || 0,
        });
      }

      // Fetch client debts
      const clientsResponse = await fetch("/api/clients");
      if (!clientsResponse.ok) {
        throw new Error("Failed to fetch clients");
      }
      const clientsData = await clientsResponse.json();
      
      if (clientsData.success && clientsData.data && Array.isArray(clientsData.data.items)) {
        // Filter clients with balance > 0
        const clientsWithDebt = clientsData.data.items
          .filter((client: { balance: number }) => client.balance > 0)
          .map((client: { id: string; name: string; totalDue: number; amountPaid: number; balance: number }) => ({
            id: client.id,
            name: client.name,
            totalDue: client.totalDue,
            amountPaid: client.amountPaid,
            balance: client.balance,
          }));
        
        setClientDebts(clientsWithDebt);
      }

      // Fetch recent payments
      const paymentsResponse = await fetch("/api/payments?limit=10");
      if (!paymentsResponse.ok) {
        throw new Error("Failed to fetch payments");
      }
      
      // Get the raw response text for debugging
      const paymentsResponseText = await paymentsResponse.text();
      console.log("Raw payments API response:", paymentsResponseText);
      
      // Parse the response text
      let paymentsData;
      try {
        paymentsData = JSON.parse(paymentsResponseText);
        console.log("Parsed payments data:", paymentsData);
      } catch (e) {
        console.error("Error parsing payments response:", e);
        throw new Error("Invalid payments response format");
      }
      
      // Check the structure of the data
      console.log("Payments data structure:", {
        hasData: !!paymentsData.data,
        dataIsArray: Array.isArray(paymentsData.data),
        hasItems: paymentsData.data && paymentsData.data.items,
        itemsIsArray: paymentsData.data && paymentsData.data.items && Array.isArray(paymentsData.data.items),
        hasNestedData: paymentsData.data && paymentsData.data.data,
        nestedDataHasItems: paymentsData.data && paymentsData.data.data && paymentsData.data.data.items
      });
      
      // Handle different data structures
      if (paymentsData.success && paymentsData.data && Array.isArray(paymentsData.data.items)) {
        console.log("Setting payments from data.items:", paymentsData.data.items);
        setRecentPayments(paymentsData.data.items);
      } else if (paymentsData.success && paymentsData.data && paymentsData.data.data && Array.isArray(paymentsData.data.data.items)) {
        console.log("Setting payments from nested data.data.items:", paymentsData.data.data.items);
        setRecentPayments(paymentsData.data.data.items);
      } else if (paymentsData.success && Array.isArray(paymentsData.data)) {
        console.log("Setting payments from array data:", paymentsData.data);
        setRecentPayments(paymentsData.data);
      } else {
        console.log("No valid payment data found, setting empty array");
        setRecentPayments([]);
      }
    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast.error("Failed to load financial data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (type: "startDate" | "endDate", value: string) => {
    setDateRange((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId === "all" ? null : clientId);
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

  const formatCurrency = (amount: number) => {
    return `DH ${amount.toFixed(2)}`;
  };

  const generateReport = (reportType: string) => {
    toast.info(`Generating ${reportType} report...`);
    
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text(reportType, 14, 22);
      
      // Add date and period
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), "MMM d, yyyy")}`, 14, 30);
      doc.text(`Period: ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`, 14, 35);
      
      // Add company info
      doc.setFontSize(12);
      doc.text("Inventory Management System", 14, 45);
      
      // Add financial summary
      doc.setFontSize(14);
      doc.text("Financial Summary", 14, 55);
      
      // Create summary table
      autoTable(doc, {
        startY: 60,
        head: [['Category', 'Amount (DH)']],
        body: [
          ['Total Sales', financialSummary.totalSales.toFixed(2)],
          ['Total Purchases', financialSummary.totalPurchases.toFixed(2)],
          ['Total Received', financialSummary.totalReceived.toFixed(2)],
          ['Total Paid', financialSummary.totalPaid.toFixed(2)],
          ['Pending Receivables', financialSummary.pendingReceivables.toFixed(2)],
          ['Pending Payables', financialSummary.pendingPayables.toFixed(2)],
          ['Profit', financialSummary.profit.toFixed(2)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
      });
      
      // Add specific content based on report type
      if (reportType === "Profit & Loss") {
        // Add P&L specific content
        const finalY = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY || 120;
        doc.text("Profit & Loss Statement", 14, finalY + 10);
        
        autoTable(doc, {
          startY: finalY + 15,
          head: [['Category', 'Amount (DH)']],
          body: [
            ['Revenue', financialSummary.totalSales.toFixed(2)],
            ['Cost of Goods', financialSummary.totalPurchases.toFixed(2)],
            ['Gross Profit', (financialSummary.totalSales - financialSummary.totalPurchases).toFixed(2)],
            ['Net Profit', financialSummary.profit.toFixed(2)],
          ],
          theme: 'grid',
        });
      } else if (reportType === "Balance Sheet") {
        // Add Balance Sheet specific content
        const finalY = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY || 120;
        doc.text("Balance Sheet", 14, finalY + 10);
        
        autoTable(doc, {
          startY: finalY + 15,
          head: [['Assets', 'Amount (DH)']],
          body: [
            ['Cash', financialSummary.totalReceived.toFixed(2)],
            ['Accounts Receivable', financialSummary.pendingReceivables.toFixed(2)],
            ['Inventory', '0.00'], // This would need actual inventory value
            ['Total Assets', (financialSummary.totalReceived + financialSummary.pendingReceivables).toFixed(2)],
          ],
          theme: 'grid',
        });
        
        const assetsY = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY || 160;
        
        autoTable(doc, {
          startY: assetsY + 10,
          head: [['Liabilities & Equity', 'Amount (DH)']],
          body: [
            ['Accounts Payable', financialSummary.pendingPayables.toFixed(2)],
            ['Equity', (financialSummary.totalReceived + financialSummary.pendingReceivables - financialSummary.pendingPayables).toFixed(2)],
            ['Total Liabilities & Equity', (financialSummary.totalReceived + financialSummary.pendingReceivables).toFixed(2)],
          ],
          theme: 'grid',
        });
      } else if (reportType === "Cash Flow") {
        // Add Cash Flow specific content
        const finalY = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY || 120;
        doc.text("Cash Flow Statement", 14, finalY + 10);
        
        autoTable(doc, {
          startY: finalY + 15,
          head: [['Cash Flow', 'Amount (DH)']],
          body: [
            ['Cash from Operations', financialSummary.totalReceived.toFixed(2)],
            ['Cash used in Operations', financialSummary.totalPaid.toFixed(2)],
            ['Net Cash Flow', (financialSummary.totalReceived - financialSummary.totalPaid).toFixed(2)],
          ],
          theme: 'grid',
        });
      } else if (reportType === "Client Statement" && selectedClient) {
        // Add Client Statement specific content
        const client = clientDebts.find(c => c.id === selectedClient);
        if (client) {
          const finalY = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY || 120;
          doc.text(`Client Statement: ${client.name}`, 14, finalY + 10);
          
          autoTable(doc, {
            startY: finalY + 15,
            head: [['Category', 'Amount (DH)']],
            body: [
              ['Total Due', client.totalDue.toFixed(2)],
              ['Amount Paid', client.amountPaid.toFixed(2)],
              ['Balance', client.balance.toFixed(2)],
            ],
            theme: 'grid',
          });
        }
      } else if (reportType === "Aging Report") {
        // Add Aging Report specific content
        const finalY = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY || 120;
        doc.text("Accounts Receivable Aging Report", 14, finalY + 10);
        
        // In a real implementation, you would categorize receivables by age
        autoTable(doc, {
          startY: finalY + 15,
          head: [['Client', 'Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Total']],
          body: clientDebts.map(client => [
            client.name,
            client.balance.toFixed(2), // This is simplified - would need actual aging data
            '0.00',
            '0.00',
            '0.00',
            '0.00',
            client.balance.toFixed(2),
          ]),
          theme: 'grid',
        });
      } else if (reportType === "Payment History") {
        // Add Payment History specific content
        const finalY = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY || 120;
        doc.text("Payment History Report", 14, finalY + 10);
        
        autoTable(doc, {
          startY: finalY + 15,
          head: [['Date', 'Client', 'Method', 'Amount', 'Status']],
          body: recentPayments
            .filter(payment => !selectedClient || payment.clientId === selectedClient)
            .map(payment => [
              formatDate(payment.createdAt),
              payment.transaction?.type === "PURCHASE" 
                ? "Supplier Payment" 
                : (payment.client?.name || "Unknown Client"),
              getPaymentMethodLabel(payment.paymentMethod),
              payment.amount.toFixed(2),
              payment.status,
            ]),
          theme: 'grid',
        });
      }
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
      
      // Save the PDF
      doc.save(`${reportType.toLowerCase().replace(/\s+/g, '-')}-report.pdf`);
      
      toast.success(`${reportType} report downloaded successfully`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Management</h1>
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="startDate" className="text-xs">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange("startDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-xs">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Financial Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          {/* Payment Analytics Chart */}
          <PaymentChart 
            payments={recentPayments} 
            dateRange={dateRange}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(financialSummary.totalSales)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Received: {formatCurrency(financialSummary.totalReceived)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pending: {formatCurrency(financialSummary.pendingReceivables)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-blue-600" />
                  Purchases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(financialSummary.totalPurchases)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Paid: {formatCurrency(financialSummary.totalPaid)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pending: {formatCurrency(financialSummary.pendingPayables)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(financialSummary.profit)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  For period {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading payments...</div>
              ) : recentPayments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No payment records found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Client</th>
                        <th className="px-4 py-2 text-left">Method</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.map((payment) => (
                        <tr key={payment.id} className="border-b">
                          <td className="px-4 py-2">{formatDate(payment.createdAt)}</td>
                          <td className="px-4 py-2">
                            {payment.transaction?.type === "PURCHASE" 
                              ? "Supplier Payment" 
                              : (payment.client?.name || "Unknown Client")}
                          </td>
                          <td className="px-4 py-2">{getPaymentMethodLabel(payment.paymentMethod)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(payment.amount)}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receivables Tab */}
        <TabsContent value="receivables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Receivables</CardTitle>
              <CardDescription>Outstanding balances from clients</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading client data...</div>
              ) : clientDebts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No outstanding balances found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left">Client</th>
                        <th className="px-4 py-2 text-right">Total Due</th>
                        <th className="px-4 py-2 text-right">Amount Paid</th>
                        <th className="px-4 py-2 text-right">Balance</th>
                        <th className="px-4 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientDebts.map((client) => (
                        <tr key={client.id} className="border-b">
                          <td className="px-4 py-2">{client.name}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(client.totalDue)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(client.amountPaid)}</td>
                          <td className="px-4 py-2 text-right font-medium text-destructive">
                            {formatCurrency(client.balance)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/clients/${client.id}`)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-medium">
                        <td className="px-4 py-2">Total</td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(clientDebts.reduce((sum, client) => sum + client.totalDue, 0))}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(clientDebts.reduce((sum, client) => sum + client.amountPaid, 0))}
                        </td>
                        <td className="px-4 py-2 text-right text-destructive">
                          {formatCurrency(clientDebts.reduce((sum, client) => sum + client.balance, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="paymentClientSelect">Filter by Client</Label>
                  <Select
                    value={selectedClient || "all"}
                    onValueChange={handleClientSelect}
                  >
                    <SelectTrigger id="paymentClientSelect">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clientDebts.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => generateReport("Payment History")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading payments...</div>
              ) : recentPayments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No payment records found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Client</th>
                        <th className="px-4 py-2 text-left">Transaction</th>
                        <th className="px-4 py-2 text-left">Method</th>
                        <th className="px-4 py-2 text-left">Reference</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments
                        .filter(payment => !selectedClient || payment.clientId === selectedClient)
                        .map((payment) => (
                          <tr key={payment.id} className="border-b">
                            <td className="px-4 py-2">{formatDate(payment.createdAt)}</td>
                            <td className="px-4 py-2">
                              {payment.transaction?.type === "PURCHASE" 
                                ? "Supplier Payment" 
                                : (payment.client?.name || "Unknown Client")}
                            </td>
                            <td className="px-4 py-2">
                              {payment.transaction?.type === "SALE" ? "Sale" : "Purchase"} #{payment.transactionId.substring(0, 8)}
                            </td>
                            <td className="px-4 py-2">{getPaymentMethodLabel(payment.paymentMethod)}</td>
                            <td className="px-4 py-2">{payment.reference || "—"}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(payment.amount)}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>Generate financial statements and reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Profit & Loss Statement</h3>
                  <p className="text-sm text-muted-foreground">
                    Summary of revenues, costs, and expenses for the selected period.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => generateReport("Profit & Loss")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate P&L Statement
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-medium">Balance Sheet</h3>
                  <p className="text-sm text-muted-foreground">
                    Snapshot of assets, liabilities, and equity at a specific point in time.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => generateReport("Balance Sheet")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Balance Sheet
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-medium">Cash Flow Statement</h3>
                  <p className="text-sm text-muted-foreground">
                    Analysis of cash inflows and outflows during the selected period.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => generateReport("Cash Flow")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Cash Flow Statement
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Reports</CardTitle>
                <CardDescription>Generate client-specific financial reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reportClientSelect">Select Client</Label>
                  <Select
                    value={selectedClient || "all"}
                    onValueChange={handleClientSelect}
                  >
                    <SelectTrigger id="reportClientSelect">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clientDebts.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Client Statement</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed statement of all transactions and payments for the selected client.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => generateReport("Client Statement")}
                    disabled={!selectedClient}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Client Statement
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-medium">Aging Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Analysis of outstanding receivables by age (30, 60, 90+ days).
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => generateReport("Aging Report")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Aging Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
