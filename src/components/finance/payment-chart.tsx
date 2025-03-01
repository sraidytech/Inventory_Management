"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
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
  Cell
} from "recharts";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameMonth } from "date-fns";

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

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Payment Analytics</CardTitle>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`DH ${value.toFixed(2)}`, ""]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Bar dataKey="received" name="Received" fill="#4ade80" />
                <Bar dataKey="paid" name="Paid" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`DH ${value.toFixed(2)}`, "Amount"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="h-80 mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end" 
                height={60} 
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`DH ${value.toFixed(2)}`, ""]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                name="Net Cash Flow" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
