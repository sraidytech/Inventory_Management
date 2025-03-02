import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

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

interface UseDashboardDataReturn {
  stats: DashboardStats | null;
  payments: Payment[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  setDateRange: (startDate: string, endDate: string) => void;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export function useDashboardData(): UseDashboardDataReturn {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize with today's date
  const today = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRangeState] = useState({
    startDate: today,
    endDate: today
  });

  // Function to update date range
  const setDateRange = (startDate: string, endDate: string) => {
    console.log("Setting date range in hook:", startDate, endDate);
    setDateRangeState({ startDate, endDate });
  };

  // Function to fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Fetching dashboard data with date range:", dateRange.startDate, dateRange.endDate);

      const token = await getToken();
      
      // Fetch stats
      const statsUrl = new URL("/api/dashboard/stats", window.location.origin);
      statsUrl.searchParams.append("startDate", dateRange.startDate);
      statsUrl.searchParams.append("endDate", dateRange.endDate);
      statsUrl.searchParams.append("_t", Date.now().toString()); // Prevent caching

      console.log("Fetching stats from URL:", statsUrl.toString());

      const statsResponse = await fetch(statsUrl.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      paymentsUrl.searchParams.append("startDate", dateRange.startDate);
      paymentsUrl.searchParams.append("endDate", dateRange.endDate);
      paymentsUrl.searchParams.append("_t", Date.now().toString()); // Prevent caching

      console.log("Fetching payments from URL:", paymentsUrl.toString());

      const paymentsResponse = await fetch(paymentsUrl.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      setPayments(Array.isArray(paymentsData.data?.items) ? paymentsData.data.items : []);
      
      console.log("Dashboard data fetched successfully");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
      console.error("Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, dateRange]);

  // Fetch data when date range changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    payments,
    isLoading,
    error,
    refresh: fetchStats,
    setDateRange,
    dateRange,
  };
}
