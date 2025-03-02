"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps,
  LineChart,
  Line
} from "recharts";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameMonth } from "date-fns";

// Custom tooltip component for better styling
const CustomTooltip = ({ active, payload, label, valuePrefix = "DH" }: TooltipProps<number, string> & { valuePrefix?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`tooltip-${index}`} className="flex items-center gap-2 my-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}: </span>
            <span className="font-medium">{valuePrefix} {Number(entry.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface Transaction {
  id: string;
  type: "PURCHASE" | "SALE" | "ADJUSTMENT";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  total: number;
  amountPaid?: number;
  remainingAmount?: number;
  createdAt: string;
}

interface SalesInventoryChartProps {
  transactions: Transaction[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  totalSales: number;
  totalPurchases: number;
  profit: number;
}

export function SalesInventoryChart({ 
  transactions, 
  dateRange,
  totalSales,
  totalPurchases,
  profit
}: SalesInventoryChartProps) {
  const [activeTab, setActiveTab] = useState("sales");
  const [timeFrame, setTimeFrame] = useState("daily");

  const generateChartData = () => {
    if (!transactions.length) return [];

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);

    let intervals: Date[] = [];
    let dateFormat = "";

    // Generate intervals based on the time frame
    if (timeFrame === "daily") {
      intervals = eachDayOfInterval({ start, end });
      dateFormat = "MMM d";
    } else if (timeFrame === "weekly") {
      intervals = eachWeekOfInterval({ start, end });
      dateFormat = "'Week of' MMM d";
    } else if (timeFrame === "monthly") {
      intervals = eachMonthOfInterval({ start, end });
      dateFormat = "MMM yyyy";
    }

    // Create data points for each interval
    return intervals.map(date => {
      // Filter transactions for this interval
      const intervalTransactions = transactions.filter(transaction => {
        const txDate = new Date(transaction.createdAt);
        if (timeFrame === "daily") {
          return isSameDay(txDate, date);
        } else if (timeFrame === "weekly") {
          // Consider transactions within the week
          const weekEnd = new Date(date);
          weekEnd.setDate(weekEnd.getDate() + 6);
          return txDate >= date && txDate <= weekEnd;
        } else if (timeFrame === "monthly") {
          return isSameMonth(txDate, date);
        }
        return false;
      });

      // Calculate totals
      const sales = intervalTransactions
        .filter(t => t.type === "SALE" && t.status === "COMPLETED")
        .reduce((sum, t) => sum + t.total, 0);

      const purchases = intervalTransactions
        .filter(t => t.type === "PURCHASE" && t.status === "COMPLETED")
        .reduce((sum, t) => sum + t.total, 0);

      return {
        date: format(date, dateFormat),
        sales,
        purchases,
        profit: sales - purchases
      };
    });
  };

  const chartData = generateChartData();

  // Modern color palette
  const COLORS = {
    sales: "#10B981", // Emerald
    purchases: "#6366F1", // Indigo
    profit: "#F59E0B", // Amber
  };

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">Sales & Inventory Analysis</CardTitle>
          <div className="flex gap-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-[200px]">
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={timeFrame} onValueChange={setTimeFrame} className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-[200px]">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-600">DH {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Purchases</p>
            <h3 className="text-2xl font-bold mt-1 text-indigo-600">DH {totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Profit</p>
            <h3 className="text-2xl font-bold mt-1 text-amber-600">DH {profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-sm">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === "sales" ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    angle={-30} 
                    textAnchor="end" 
                    height={50} 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickMargin={10}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingBottom: '10px' }}
                  />
                  <Bar 
                    dataKey="sales" 
                    name="Sales" 
                    fill={COLORS.sales} 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="purchases" 
                    name="Purchases" 
                    fill={COLORS.purchases} 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    angle={-30} 
                    textAnchor="end" 
                    height={50} 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickMargin={10}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingBottom: '10px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    name="Profit" 
                    stroke={COLORS.profit} 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
