"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  TooltipProps
} from "recharts";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameMonth } from "date-fns";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

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

interface PaymentChartProps {
  payments: Payment[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export function PaymentChart({ payments, dateRange }: PaymentChartProps) {
  const [activeTab, setActiveTab] = useState("daily");
  interface ChartDataPoint {
    date: string;
    received: number;
    paid: number;
    total: number;
  }

  interface PieDataPoint {
    name: string;
    value: number;
  }

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<PieDataPoint[]>([]);

  // Process payments data for charts
  useEffect(() => {
    if (!payments.length) {
      setChartData([]);
      setPaymentMethodData([]);
      return;
    }

    // Process payment method data for pie chart
    const methodCounts: Record<string, number> = {};
    payments.forEach(payment => {
      const method = payment.paymentMethod;
      methodCounts[method] = (methodCounts[method] || 0) + payment.amount;
    });

    const pieData = Object.entries(methodCounts).map(([name, value]) => ({
      name: getPaymentMethodLabel(name),
      value
    }));
    setPaymentMethodData(pieData);

    // Process time-based data based on active tab
    generateChartData();
  }, [payments, activeTab, dateRange]);

  const generateChartData = () => {
    if (!payments.length) return;

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);

    let intervals: Date[] = [];
    let dateFormat = "";

    // Generate intervals based on the active tab
    if (activeTab === "daily") {
      intervals = eachDayOfInterval({ start, end });
      dateFormat = "MMM d";
    } else if (activeTab === "weekly") {
      intervals = eachWeekOfInterval({ start, end });
      dateFormat = "'Week of' MMM d";
    } else if (activeTab === "monthly") {
      intervals = eachMonthOfInterval({ start, end });
      dateFormat = "MMM yyyy";
    }

    // Create data points for each interval
    const data = intervals.map(date => {
      // Filter payments for this interval
      const intervalPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        if (activeTab === "daily") {
          return isSameDay(paymentDate, date);
        } else if (activeTab === "weekly") {
          // Consider payments within the week
          const weekEnd = new Date(date);
          weekEnd.setDate(weekEnd.getDate() + 6);
          return paymentDate >= date && paymentDate <= weekEnd;
        } else if (activeTab === "monthly") {
          return isSameMonth(paymentDate, date);
        }
        return false;
      });

      // Calculate totals
      const received = intervalPayments
        .filter(p => p.transaction?.type === "SALE")
        .reduce((sum, p) => sum + p.amount, 0);

      const paid = intervalPayments
        .filter(p => p.transaction?.type === "PURCHASE")
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        date: format(date, dateFormat),
        received,
        paid,
        total: received - paid
      };
    });

    setChartData(data);
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

  // Modern color palette
  const COLORS = {
    received: "#6366F1", // Indigo
    paid: "#EC4899",     // Pink
    cashFlow: "#14B8A6", // Teal
    pieColors: [
      "#6366F1", // Indigo (primary)
      "#14B8A6", // Teal
      "#F59E0B", // Amber
      "#EC4899", // Pink
      "#8B5CF6"  // Purple
    ]
  };

  // Calculate total received and paid for summary
  const totalReceived = chartData.reduce((sum, item) => sum + item.received, 0);
  const totalPaid = chartData.reduce((sum, item) => sum + item.paid, 0);
  const netCashFlow = totalReceived - totalPaid;

  // Remove unused variables since we're not conditionally rendering based on data presence

  return (
    <Card className="col-span-2 shadow-md border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">Payment Analytics</CardTitle>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <h3 className="text-2xl font-bold mt-1">DH {totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                <ArrowUpRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <h3 className="text-2xl font-bold mt-1">DH {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full">
                <ArrowDownRight className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                <h3 className="text-2xl font-bold mt-1">DH {netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cash Flow Chart */}
          <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-sm">
            <h3 className="text-base font-medium mb-4">Cash Flow</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                >
                  <defs>
                    <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.received} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={COLORS.received} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.paid} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={COLORS.paid} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                  <Area 
                    type="monotone" 
                    dataKey="received" 
                    name="Received" 
                    stroke={COLORS.received} 
                    fillOpacity={1}
                    fill="url(#colorReceived)"
                    strokeWidth={2}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="paid" 
                    name="Paid" 
                    stroke={COLORS.paid} 
                    fillOpacity={1}
                    fill="url(#colorPaid)"
                    strokeWidth={2}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Payment Methods Chart */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-sm">
            <h3 className="text-base font-medium mb-4">Payment Methods</h3>
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={70}
                    paddingAngle={1}
                    dataKey="value"
                    // Remove label and labelLine props to prevent default labels
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS.pieColors[index % COLORS.pieColors.length]} 
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  {/* Use a simpler legend configuration */}
                  <Legend 
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => (
                      <span className="text-sm">{value}</span>
                    )}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Net Cash Flow Trend */}
        <div className="mt-6 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-sm">
          <h3 className="text-base font-medium mb-4">Net Cash Flow Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
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
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  name="Net Cash Flow" 
                  stroke={COLORS.cashFlow} 
                  strokeWidth={3}
                  dot={{ r: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
