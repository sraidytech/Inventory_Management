"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { DashboardLoading, DashboardError } from "@/components/dashboard/loading";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import {
  Package2Icon,
  AlertTriangleIcon,
  UsersIcon,
  FolderIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArchiveIcon,
} from "lucide-react";

export default function DashboardPage() {
  const { stats, isLoading, error } = useDashboardStats();

  if (isLoading) return <DashboardLoading />;
  if (error) return <DashboardError message={error.message} />;

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Today's Sales"
          value={`$${(stats.salesToday ?? 0).toFixed(2)}`}
          icon={<TrendingUpIcon />}
          className="lg:col-span-1"
        />
        <StatCard
          title="Today's Purchases"
          value={`$${(stats.purchasesToday ?? 0).toFixed(2)}`}
          icon={<TrendingDownIcon />}
          className="lg:col-span-1"
        />
        <StatCard
          title="Total Stock Value"
          value={`$${(stats.stockValue ?? 0).toFixed(2)}`}
          icon={<ArchiveIcon />}
          className="lg:col-span-1"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RecentTransactions transactions={stats.recentTransactions ?? []} />
        <div className="rounded-lg border bg-card text-card-foreground">
          {/* Space for future chart component */}
        </div>
      </div>
    </div>
  );
}
