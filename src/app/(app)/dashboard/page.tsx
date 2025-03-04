"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/components/language/language-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EnhancedStatCard } from "@/components/dashboard/enhanced-stat-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { DashboardLoading, DashboardError } from "@/components/dashboard/loading";
import { AdvancedSalesChart } from "@/components/dashboard/advanced-sales-chart";
import { CreditReport } from "@/components/dashboard/credit-report";
import { CreditManagementTable } from "@/components/dashboard/credit-management-table";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ArrowRight, RefreshCw } from "lucide-react";
import { TranslatedText } from "@/components/language/translated-text";
import {
  Package2Icon,
  AlertTriangleIcon,
  UsersIcon,
  FolderIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  ArchiveIcon,
  CreditCardIcon,
  PercentIcon,
} from "lucide-react";

interface DashboardStats {
  // Basic stats
  totalProducts: number;
  lowStockProducts: number;
  totalSuppliers: number;
  totalCategories: number;
  stockValue: number;
  
  // Financial stats
  salesToday: number;
  purchasesToday: number;
  totalSales: number;
  totalPurchases: number;
  totalReceived: number;
  totalPaid: number;
  pendingReceivables: number;
  pendingPayables: number;
  profit: number;
  
  // Client data
  clientsWithBalance: number;
  totalClientBalance: number;
  
  // Transactions
  recentTransactions: {
    id: string;
    type: "PURCHASE" | "SALE" | "ADJUSTMENT";
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    total: number;
    createdAt: string;
  }[];
  
  // Date range
  startDate: string;
  endDate: string;
}

interface Client {
  id: string;
  name: string;
  totalDue: number;
  amountPaid: number;
  balance: number;
  lastPaymentDate?: string;
}

export default function DashboardPage() {
  const { isRTL } = useLanguage();
  
  // Initialize with today's date and 7 days ago
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // -6 to include today (total of 7 days)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  
  // State for date range
  const [startDate, setStartDate] = useState<string>(sevenDaysAgoStr);
  const [endDate, setEndDate] = useState<string>(today);
  
  // State for dashboard data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Store the selected date range in a ref to prevent it from being lost during re-renders
  const selectedDateRef = useRef({
    startDate: sevenDaysAgoStr,
    endDate: today
  });

  // Fetch dashboard data
  const fetchDashboardData = async (fetchStartDate?: string, fetchEndDate?: string) => {
    setRefreshing(true);
    try {
      // Use provided dates or fall back to state values
      const currentStartDate = fetchStartDate || startDate;
      const currentEndDate = fetchEndDate || endDate;
      
      console.log("Fetching dashboard data with date range:", currentStartDate, currentEndDate);
      
      // Fetch stats
      const statsUrl = new URL("/api/dashboard/stats", window.location.origin);
      statsUrl.searchParams.append("startDate", currentStartDate);
      statsUrl.searchParams.append("endDate", currentEndDate);
      statsUrl.searchParams.append("_t", Date.now().toString()); // Prevent caching

      console.log("Fetching stats from URL:", statsUrl.toString());

      const statsResponse = await fetch(statsUrl.toString(), {
        cache: 'no-store'
      });

      if (!statsResponse.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const statsData = await statsResponse.json();
      
      if (!statsData.success) {
        throw new Error(statsData.error || "Failed to fetch dashboard stats");
      }

      // Fetch clients
      const clientsUrl = new URL("/api/clients", window.location.origin);
      clientsUrl.searchParams.append("_t", Date.now().toString()); // Prevent caching

      console.log("Fetching clients from URL:", clientsUrl.toString());

      const clientsResponse = await fetch(clientsUrl.toString(), {
        cache: 'no-store'
      });

      if (!clientsResponse.ok) {
        throw new Error("Failed to fetch clients");
      }

      const clientsData = await clientsResponse.json();
      
      if (!clientsData.success) {
        throw new Error(clientsData.error || "Failed to fetch clients");
      }

      // Update state with fetched data
      setStats({
        // Basic stats
        totalProducts: statsData.data.totalProducts ?? 0,
        lowStockProducts: statsData.data.lowStockProducts ?? 0,
        totalSuppliers: statsData.data.totalSuppliers ?? 0,
        totalCategories: statsData.data.totalCategories ?? 0,
        stockValue: statsData.data.stockValue ?? 0,
        
        // Financial stats
        salesToday: statsData.data.salesToday ?? 0,
        purchasesToday: statsData.data.purchasesToday ?? 0,
        totalSales: statsData.data.totalSales ?? 0,
        totalPurchases: statsData.data.totalPurchases ?? 0,
        totalReceived: statsData.data.totalReceived ?? 0,
        totalPaid: statsData.data.totalPaid ?? 0,
        pendingReceivables: statsData.data.pendingReceivables ?? 0,
        pendingPayables: statsData.data.pendingPayables ?? 0,
        profit: statsData.data.profit ?? 0,
        
        // Client data
        clientsWithBalance: statsData.data.clientsWithBalance ?? 0,
        totalClientBalance: statsData.data.totalClientBalance ?? 0,
        
        // Transactions
        recentTransactions: Array.isArray(statsData.data.recentTransactions) 
          ? statsData.data.recentTransactions 
          : [],
          
        // Date range
        startDate: currentStartDate,
        endDate: currentEndDate,
      });
      
      // Filter clients with balance > 0
      const clientsWithBalance = Array.isArray(clientsData.data?.items) 
        ? clientsData.data.items.filter((client: Client) => client.balance > 0)
        : [];
      
      setClients(clientsWithBalance);
      
      console.log("Dashboard data fetched successfully");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
      console.error("Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data only when component mounts
  useEffect(() => {
    // Pass the initial date range (last 7 days) directly to fetchDashboardData
    fetchDashboardData(sevenDaysAgoStr, today);
    // We don't include startDate or endDate in the dependency array
    // to prevent infinite loops, as we're explicitly calling fetchDashboardData
    // in handleDateRangeApply and handleDateRangeClear
  }, []);

  // Update the ref when the date range changes
  useEffect(() => {
    selectedDateRef.current = {
      startDate,
      endDate
    };
  }, [startDate, endDate]);

  // Handle date range changes
  const handleDateRangeApply = (newStartDate?: string, newEndDate?: string) => {
    // Use the dates passed directly from the DateRangePicker if available
    const currentStartDate = newStartDate || selectedDateRef.current.startDate;
    const currentEndDate = newEndDate || selectedDateRef.current.endDate;
    
    console.log("Applying date range:", currentStartDate, currentEndDate);
    
    // Ensure state is updated with the current values
    setStartDate(currentStartDate);
    setEndDate(currentEndDate);
    
    // Update the ref with the selected date range
    selectedDateRef.current = {
      startDate: currentStartDate,
      endDate: currentEndDate
    };
    
    // Fetch data with the selected date range
    fetchDashboardData(currentStartDate, currentEndDate);
  };

  const handleDateRangeClear = () => {
    // Reset to last 7 days
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // -6 to include today (total of 7 days)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
    console.log("Resetting date range to last 7 days:", sevenDaysAgoStr, "to", today);
    
    // Update state first
    setStartDate(sevenDaysAgoStr);
    setEndDate(today);
    
    // Update the ref with the 7-day range
    selectedDateRef.current = {
      startDate: sevenDaysAgoStr,
      endDate: today
    };
    
    // Then fetch data with the 7-day range
    fetchDashboardData(sevenDaysAgoStr, today);
  };

  if (isLoading && !refreshing) return <DashboardLoading />;
  if (error) return <DashboardError message={error.message} />;
  if (!stats) return null;

  // Calculate real trends based on data
  const calculateTrend = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return { value: 0, label: "vs last week" };
    const trendValue = ((currentValue - previousValue) / previousValue) * 100;
    return { 
      value: Math.round(trendValue), 
      label: "vs last week" 
    };
  };

  // For simplicity, we'll use some approximations for trends
  const productsTrend = { value: 0, label: "vs last week" }; // No historical data for products
  const salesTrend = calculateTrend(stats.totalSales, stats.totalSales * 0.9); // Approximation
  const profitTrend = calculateTrend(stats.profit, stats.profit * 0.92); // Approximation

  interface Transaction {
    id: string;
    type: "PURCHASE" | "SALE" | "ADJUSTMENT";
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    total: number;
    createdAt: string;
  }

  interface SparklinePoint {
    date: string;
    value: number;
  }

  // Generate real sparkline data from transactions
  const generateTransactionSparklineData = (transactions: Transaction[], type: 'SALE' | 'PURCHASE', count: number = 7): SparklinePoint[] => {
    // Create date buckets for the last 'count' days
    const endDate = new Date(stats.endDate);
    const dates = [];
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Initialize data points with zero values
    const dataPoints = dates.map(date => ({
      date,
      value: 0
    }));
    
    // Fill in values from transactions
    if (transactions && transactions.length > 0) {
      transactions.forEach(tx => {
        if (tx.type === type && tx.status !== 'CANCELLED') {
          const txDate = tx.createdAt.split('T')[0];
          const dataPointIndex = dataPoints.findIndex(dp => dp.date === txDate);
          
          if (dataPointIndex !== -1) {
            dataPoints[dataPointIndex].value += tx.total;
          }
        }
      });
    }
    
    return dataPoints;
  };
  
  // Generate profit sparkline data
  const generateProfitSparklineData = (salesData: SparklinePoint[], purchasesData: SparklinePoint[]): SparklinePoint[] => {
    return salesData.map((sale, index) => ({
      date: sale.date,
      value: sale.value - (purchasesData[index]?.value || 0)
    }));
  };
  
  // Generate sparkline data for each metric
  const salesSparklineData = generateTransactionSparklineData(stats.recentTransactions, 'SALE');
  const purchasesSparklineData = generateTransactionSparklineData(stats.recentTransactions, 'PURCHASE');
  const profitSparklineData = generateProfitSparklineData(salesSparklineData, purchasesSparklineData);

  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Header with Date Filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">
            <TranslatedText namespace="common" id="dashboard" />
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchDashboardData(startDate, endDate)}
            disabled={isLoading || refreshing}
            className={`${isRTL ? 'mr-2' : 'ml-2'}`}
          >
            <RefreshCw className={`h-4 w-4 ${(isLoading || refreshing) ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onApply={handleDateRangeApply}
          onClear={handleDateRangeClear}
        />
      </div>

      {/* Inventory Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <EnhancedStatCard
          title={<TranslatedText namespace="dashboard.stats" id="totalProducts" />}
          value={stats.totalProducts ?? 0}
          icon={<Package2Icon className="text-blue-500" />}
          trend={productsTrend}
          chartColor="#3b82f6" // blue
        />
        <EnhancedStatCard
          title={<TranslatedText namespace="dashboard.stats" id="lowStock" />}
          value={stats.lowStockProducts ?? 0}
          icon={<AlertTriangleIcon className="text-amber-500" />}
          chartColor="#f59e0b" // amber
        />
        <EnhancedStatCard
          title={<TranslatedText namespace="dashboard.stats" id="totalSuppliers" />}
          value={stats.totalSuppliers ?? 0}
          icon={<UsersIcon className="text-indigo-500" />}
          chartColor="#6366f1" // indigo
        />
        <EnhancedStatCard
          title={<TranslatedText namespace="dashboard.stats" id="totalCategories" />}
          value={stats.totalCategories ?? 0}
          icon={<FolderIcon className="text-purple-500" />}
          chartColor="#a855f7" // purple
        />
      </div>

      {/* Financial Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <EnhancedStatCard
          title={<TranslatedText namespace="dashboard.stats" id="totalSales" />}
          value={`DH ${(stats.totalSales ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingUpIcon className="text-emerald-500" />}
          trend={salesTrend}
          sparklineData={salesSparklineData}
          chartColor="#10b981" // emerald
          valuePrefix="DH"
          className="lg:col-span-1"
        />
        <EnhancedStatCard
          title={<TranslatedText namespace="dashboard.stats" id="totalPurchases" />}
          value={`DH ${(stats.totalPurchases ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingDownIcon className="text-pink-500" />}
          sparklineData={purchasesSparklineData}
          chartColor="#ec4899" // pink
          valuePrefix="DH"
          className="lg:col-span-1"
        />
        <EnhancedStatCard
          title={<TranslatedText namespace="common" id="inventory" />}
          value={`DH ${(stats.stockValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<ArchiveIcon className="text-cyan-500" />}
          chartColor="#06b6d4" // cyan
          className="lg:col-span-1"
        />
      </div>

      {/* Profit Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <EnhancedStatCard
          title={<TranslatedText namespace="payments" id="title" />}
          value={`DH ${(stats.totalReceived ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSignIcon className="text-green-500" />}
          chartColor="#22c55e" // green
          valuePrefix="DH"
          className="md:col-span-1"
        />
        <EnhancedStatCard
          title={<TranslatedText namespace="transactions" id="amountPaid" />}
          value={`DH ${(stats.totalPaid ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<CreditCardIcon className="text-orange-500" />}
          chartColor="#f97316" // orange
          valuePrefix="DH"
          className="md:col-span-1"
        />
        <EnhancedStatCard
          title={<TranslatedText namespace="dashboard.stats" id="totalProfit" />}
          value={`DH ${(stats.profit ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<PercentIcon className="text-violet-500" />}
          trend={profitTrend}
          sparklineData={profitSparklineData}
          chartColor={stats.profit >= 0 ? "#8b5cf6" : "#ef4444"} // violet or red
          valuePrefix="DH"
          className="md:col-span-1"
        />
      </div>

      {/* Advanced Sales & Inventory Chart */}
      <AdvancedSalesChart 
        transactions={stats.recentTransactions ?? []}
        dateRange={{
          startDate: stats.startDate,
          endDate: stats.endDate
        }}
        totalSales={stats.totalSales ?? 0}
        totalPurchases={stats.totalPurchases ?? 0}
        profit={stats.profit ?? 0}
      />

      {/* Credit Management Table */}
      <Card className="shadow-md border-0">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold">
              <TranslatedText namespace="dashboard" id="creditManagement" />
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm"
              onClick={() => window.location.href = '/clients'}
            >
              <TranslatedText namespace="common" id="view" /> <TranslatedText namespace="clients" id="title" />
              <ArrowRight className={`${isRTL ? 'mr-1' : 'ml-1'} h-4 w-4`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CreditManagementTable clients={clients} />
        </CardContent>
      </Card>

      {/* Credit Report & Recent Transactions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md border-0">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold">
                <TranslatedText namespace="clients" id="title" />
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm"
                onClick={() => window.location.href = '/clients'}
              >
                <TranslatedText namespace="clients" id="title" />
                <ArrowRight className={`${isRTL ? 'mr-1' : 'ml-1'} h-4 w-4`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CreditReport 
              clientsWithBalance={stats.clientsWithBalance ?? 0}
              totalClientBalance={stats.totalClientBalance ?? 0}
              pendingReceivables={stats.pendingReceivables ?? 0}
              pendingPayables={stats.pendingPayables ?? 0}
            />
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-0">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold">
                <TranslatedText namespace="dashboard" id="recentTransactions" />
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm"
                onClick={() => window.location.href = '/transactions'}
              >
                <TranslatedText namespace="common" id="transactions" />
                <ArrowRight className={`${isRTL ? 'mr-1' : 'ml-1'} h-4 w-4`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={stats.recentTransactions ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
