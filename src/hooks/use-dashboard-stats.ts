import { useCallback, useEffect, useState } from "react";
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

interface UseStatsReturn {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: Error | null;
  refresh: (startDate?: string, endDate?: string) => Promise<void>;
  setDateRange: (startDate: string, endDate: string) => void;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export function useDashboardStats(): UseStatsReturn {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dateRange, setDateRangeState] = useState({
    startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    endDate: new Date().toISOString().split('T')[0]
  });

  const setDateRange = (startDate: string, endDate: string) => {
    setDateRangeState({ startDate, endDate });
  };

  const fetchStats = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Use provided dates or fall back to state
      const start = startDate || dateRange.startDate;
      const end = endDate || dateRange.endDate;

      console.log("Fetching stats with date range:", start, end);

      const token = await getToken();
      const url = new URL("/api/dashboard/stats", window.location.origin);
      
      // Add date range parameters
      if (start) url.searchParams.append("startDate", start);
      if (end) url.searchParams.append("endDate", end);

      console.log("Fetching from URL:", url.toString());

      // Add a timestamp to prevent caching
      url.searchParams.append("_t", Date.now().toString());

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Add cache: 'no-store' to prevent caching
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to fetch dashboard stats");
      }

      if (!responseData.data) {
        throw new Error("No data received from server");
      }

      const { data } = responseData;
      setStats({
        // Basic stats
        totalProducts: data.totalProducts ?? 0,
        lowStockProducts: data.lowStockProducts ?? 0,
        totalSuppliers: data.totalSuppliers ?? 0,
        totalCategories: data.totalCategories ?? 0,
        stockValue: data.stockValue ?? 0,
        
        // Financial stats
        salesToday: data.salesToday ?? 0,
        purchasesToday: data.purchasesToday ?? 0,
        totalSales: data.totalSales ?? 0,
        totalPurchases: data.totalPurchases ?? 0,
        totalReceived: data.totalReceived ?? 0,
        totalPaid: data.totalPaid ?? 0,
        pendingReceivables: data.pendingReceivables ?? 0,
        pendingPayables: data.pendingPayables ?? 0,
        profit: data.profit ?? 0,
        
        // Client data
        clientsWithBalance: data.clientsWithBalance ?? 0,
        totalClientBalance: data.totalClientBalance ?? 0,
        
        // Transactions
        recentTransactions: Array.isArray(data.recentTransactions) 
          ? data.recentTransactions 
          : [],
          
        // Date range
        startDate: data.startDate ?? start,
        endDate: data.endDate ?? end,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
    } finally {
      setIsLoading(false);
    }
  }, [getToken, dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, dateRange]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
    setDateRange,
    dateRange,
  };
}
