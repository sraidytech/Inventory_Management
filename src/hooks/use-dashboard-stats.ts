 import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalSuppliers: number;
  totalCategories: number;
  recentTransactions: {
    id: string;
    type: "PURCHASE" | "SALE" | "ADJUSTMENT";
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    total: number;
    createdAt: string;
  }[];
  stockValue: number;
  salesToday: number;
  purchasesToday: number;
}

interface UseStatsReturn {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useDashboardStats(): UseStatsReturn {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();
      const response = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const { data, error } = await response.json();
      
      if (error) {
        throw new Error(error.message || "Failed to fetch dashboard stats");
      }

      if (!data) {
        throw new Error("No data received from server");
      }

      setStats({
        totalProducts: data.totalProducts ?? 0,
        lowStockProducts: data.lowStockProducts ?? 0,
        totalSuppliers: data.totalSuppliers ?? 0,
        totalCategories: data.totalCategories ?? 0,
        recentTransactions: Array.isArray(data.recentTransactions) 
          ? data.recentTransactions 
          : [],
        stockValue: data.stockValue ?? 0,
        salesToday: data.salesToday ?? 0,
        purchasesToday: data.purchasesToday ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  };
}
