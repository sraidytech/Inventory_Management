"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { DashboardLoading, DashboardError } from "@/components/dashboard/loading";
import { SalesInventoryChart } from "@/components/dashboard/sales-inventory-chart";
import { CreditReport } from "@/components/dashboard/credit-report";
import { PaymentChart } from "@/components/finance/payment-chart";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ArrowRight, RefreshCw } from "lucide-react";
import {
  Package2Icon,
  AlertTriangleIcon,
  UsersIcon,
  FolderIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArchiveIcon,
  DollarSignIcon,
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

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  transaction?: {
    type: string;
  };
}

export default function DashboardPage() {
  // Initialize with today's date
  const today = new Date().toISOString().split('T')[0];
  
  // State for date range
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  
  // State for dashboard data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Store the selected date range in a ref to prevent it from being lost during re-renders
  const selectedDateRef = useRef({
    startDate: today,
    endDate: today
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      // Make sure we're using the latest state values
      const currentStartDate = startDate;
      const currentEndDate = endDate;
      
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

      // Fetch payments
      const paymentsUrl = new URL("/api/payments", window.location.origin);
      paymentsUrl.searchParams.append("startDate", currentStartDate);
      paymentsUrl.searchParams.append("endDate", currentEndDate);
      paymentsUrl.searchParams.append("_t", Date.now().toString()); // Prevent caching

      console.log("Fetching payments from URL:", paymentsUrl.toString());

      const paymentsResponse = await fetch(paymentsUrl.toString(), {
        cache: 'no-store'
      });

      if (!paymentsResponse.ok) {
        throw new Error("Failed to fetch payments");
      }

      const paymentsData = await paymentsResponse.json();
      
      if (!paymentsData.success) {
        throw new Error(paymentsData.error || "Failed to fetch payments");
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

      setPayments(Array.isArray(paymentsData.data?.items) ? paymentsData.data.items : []);
      
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
    fetchDashboardData();
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
  const handleDateRangeApply = () => {
    console.log("Applying date range:", startDate, endDate);
    
    // Update the ref with the selected date range
    selectedDateRef.current = {
      startDate,
      endDate
    };
    
    // Ensure we're using the latest state values, not the ref values
    // This ensures the API calls use the correct date range
    setStartDate(startDate);
    setEndDate(endDate);
    
    // Fetch data with the selected date range
    fetchDashboardData();
  };

  const handleDateRangeClear = () => {
    const today = new Date().toISOString().split('T')[0];
    console.log("Clearing date range to today:", today);
    
    // Update state first
    setStartDate(today);
    setEndDate(today);
    
    // Update the ref with today's date
    selectedDateRef.current = {
      startDate: today,
      endDate: today
    };
    
    // Then fetch data
    fetchDashboardData();
  };

  if (isLoading && !refreshing) return <DashboardLoading />;
  if (error) return <DashboardError message={error.message} />;
  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Header with Date Filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchDashboardData}
            disabled={isLoading || refreshing}
            className="ml-2"
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
        <StatCard
          title="Total Products"
          value={stats.totalProducts ?? 0}
          icon={<Package2Icon />}
        />
        <StatCard
          title="Low Stock Products"
          value={stats.lowStockProducts ?? 0}
          icon={<AlertTriangleIcon />}
          className={
            (stats.lowStockProducts ?? 0) > 0 ? "border-yellow-500 border-2" : ""
          }
        />
        <StatCard
          title="Total Suppliers"
          value={stats.totalSuppliers ?? 0}
          icon={<UsersIcon />}
        />
        <StatCard
          title="Total Categories"
          value={stats.totalCategories ?? 0}
          icon={<FolderIcon />}
        />
      </div>

      {/* Financial Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Sales"
          value={`DH ${(stats.totalSales ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingUpIcon />}
          className="lg:col-span-1"
        />
        <StatCard
          title="Total Purchases"
          value={`DH ${(stats.totalPurchases ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingDownIcon />}
          className="lg:col-span-1"
        />
        <StatCard
          title="Total Stock Value"
          value={`DH ${(stats.stockValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<ArchiveIcon />}
          className="lg:col-span-1"
        />
      </div>

      {/* Profit Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Received"
          value={`DH ${(stats.totalReceived ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSignIcon />}
          className="md:col-span-1"
        />
        <StatCard
          title="Total Paid"
          value={`DH ${(stats.totalPaid ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<CreditCardIcon />}
          className="md:col-span-1"
        />
        <StatCard
          title="Profit"
          value={`DH ${(stats.profit ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<PercentIcon />}
          className="md:col-span-1"
        />
      </div>

      {/* Sales & Inventory Chart */}
      <SalesInventoryChart 
        transactions={stats.recentTransactions ?? []}
        dateRange={{
          startDate: stats.startDate,
          endDate: stats.endDate
        }}
        totalSales={stats.totalSales ?? 0}
        totalPurchases={stats.totalPurchases ?? 0}
        profit={stats.profit ?? 0}
      />

      {/* Credit Report & Recent Transactions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md border-0">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold">Credit Report</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm"
                onClick={() => window.location.href = '/clients'}
              >
                View All Clients
                <ArrowRight className="ml-1 h-4 w-4" />
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
              <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm"
                onClick={() => window.location.href = '/transactions'}
              >
                View All Transactions
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={stats.recentTransactions ?? []} />
          </CardContent>
        </Card>
      </div>

      {/* Payment Analytics */}
      <Card className="shadow-md border-0">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold">Payment Analytics</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm"
              onClick={() => window.location.href = '/finance'}
            >
              View Finance
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PaymentChart 
            payments={payments}
            dateRange={{
              startDate: stats.startDate,
              endDate: stats.endDate
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
