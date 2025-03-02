"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  TooltipProps
} from "recharts";
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns";
import { ArrowRight } from "lucide-react";

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
  createdAt: string;
}

interface AdvancedSalesChartProps {
  transactions: Transaction[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  totalSales: number;
  totalPurchases: number;
  profit: number;
}

export function AdvancedSalesChart({
  transactions,
  dateRange,
  totalSales,
  totalPurchases,
  profit
}: AdvancedSalesChartProps) {
  const [activeTab, setActiveTab] = useState("sales");
  const [chartType, setChartType] = useState<"line" | "area" | "bar" | "composed">("area");
  const showForecast = false;

  // Define chart data type
  interface ChartDataPoint {
    date: string;
    displayDate: string;
    sales: number;
    purchases: number;
    profit: number;
    transactions: number;
    salesMA?: number;
    purchasesMA?: number;
    isForecast?: boolean;
  }

  // Process transactions data for charts
  const processTransactionData = (): ChartDataPoint[] => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    // Generate array of all dates in range
    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Initialize data with all dates
    const data = dateInterval.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      return {
        date: dateStr,
        displayDate: format(date, "MMM dd"),
        sales: 0,
        purchases: 0,
        profit: 0,
        transactions: 0
      } as ChartDataPoint;
    });
    
    // Fill in transaction data
    transactions.forEach(transaction => {
      const txDate = transaction.createdAt.split('T')[0]; // Get date part only
      const dataPoint = data.find(d => d.date === txDate);
      
      if (dataPoint) {
        if (transaction.type === "SALE" && transaction.status === "COMPLETED") {
          dataPoint.sales += transaction.total;
          dataPoint.transactions += 1;
        } else if (transaction.type === "PURCHASE" && transaction.status === "COMPLETED") {
          dataPoint.purchases += transaction.total;
        }
      }
    });
    
    // Calculate profit and add moving averages
    const windowSize = 3; // 3-day moving average
    
    data.forEach((day, index) => {
      // Calculate profit
      day.profit = day.sales - day.purchases;
      
      // Calculate moving averages if enough data points
      if (index >= windowSize - 1) {
        let salesSum = 0;
        let purchasesSum = 0;
        
        for (let i = 0; i < windowSize; i++) {
          salesSum += data[index - i].sales;
          purchasesSum += data[index - i].purchases;
        }
        
        day.salesMA = salesSum / windowSize;
        day.purchasesMA = purchasesSum / windowSize;
      }
    });
    
    return data;
  };

  // Generate simple forecast data
  const generateForecastData = (data: ChartDataPoint[]) => {
    if (data.length < 5) return []; // Need enough data for forecast
    
    // Use last 5 days to forecast next 3 days
    const lastDays = data.slice(-5);
    const lastDate = parseISO(lastDays[lastDays.length - 1].date);
    
    // Calculate average daily change
    let salesChange = 0;
    let purchasesChange = 0;
    
    for (let i = 1; i < lastDays.length; i++) {
      salesChange += lastDays[i].sales - lastDays[i-1].sales;
      purchasesChange += lastDays[i].purchases - lastDays[i-1].purchases;
    }
    
    salesChange = salesChange / (lastDays.length - 1);
    purchasesChange = purchasesChange / (lastDays.length - 1);
    
    // Generate forecast for next 3 days
    const forecast = [];
    let lastSales = lastDays[lastDays.length - 1].sales;
    let lastPurchases = lastDays[lastDays.length - 1].purchases;
    
    for (let i = 1; i <= 3; i++) {
      const forecastDate = format(subDays(lastDate, -i), "yyyy-MM-dd");
      const displayDate = format(subDays(lastDate, -i), "MMM dd");
      
      // Apply some randomness to make it look more realistic
      const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
      
      const forecastSales = Math.max(0, lastSales + salesChange * randomFactor);
      const forecastPurchases = Math.max(0, lastPurchases + purchasesChange * randomFactor);
      
      forecast.push({
        date: forecastDate,
        displayDate,
        sales: forecastSales,
        purchases: forecastPurchases,
        profit: forecastSales - forecastPurchases,
        isForecast: true
      });
      
      lastSales = forecastSales;
      lastPurchases = forecastPurchases;
    }
    
    return forecast;
  };

  // Prepare chart data
  const chartData = processTransactionData();
  const forecastData = generateForecastData(chartData);
  const combinedData = showForecast ? [...chartData, ...forecastData] : chartData;

  // Render appropriate chart based on active tab and chart type
  const renderChart = () => {
    // Common chart props
    const commonProps = {
      data: combinedData,
      margin: { top: 10, right: 30, left: 0, bottom: 30 }
    };
    
    // Sales and Purchases chart
    if (activeTab === "sales") {
      // Line chart
      if (chartType === "line") {
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
                iconSize={8}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                name="Sales" 
                stroke="#6366F1" 
                strokeWidth={2}
                strokeDasharray="5,5"
                dot={{ r: 3 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="purchases" 
                name="Purchases" 
                stroke="#EC4899" 
                strokeWidth={2}
                strokeDasharray="5,5"
                dot={{ r: 3 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              {showForecast && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="salesMA" 
                    name="Sales Trend" 
                    stroke="#818CF8" 
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="purchasesMA" 
                    name="Purchases Trend" 
                    stroke="#F472B6" 
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </>
              )}
              {showForecast && (
                <ReferenceLine x={chartData[chartData.length - 1].displayDate} stroke="#888" strokeDasharray="3 3" label={{ value: 'Forecast Start', position: 'insideTopRight', fill: '#888', fontSize: 12 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
      }
      
      // Area chart
      if (chartType === "area") {
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
                iconSize={8}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                name="Sales" 
                stroke="#6366F1" 
                fillOpacity={1}
                fill="url(#colorSales)"
                strokeWidth={2}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Area 
                type="monotone" 
                dataKey="purchases" 
                name="Purchases" 
                stroke="#EC4899" 
                fillOpacity={1}
                fill="url(#colorPurchases)"
                strokeWidth={2}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              {showForecast && (
                <ReferenceLine x={chartData[chartData.length - 1].displayDate} stroke="#888" strokeDasharray="3 3" label={{ value: 'Forecast Start', position: 'insideTopRight', fill: '#888', fontSize: 12 }} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );
      }
      
      // Bar chart
      if (chartType === "bar") {
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
                iconSize={8}
              />
              <Bar 
                dataKey="sales" 
                name="Sales" 
                fill="#6366F1" 
                radius={[4, 4, 0, 0]}
                barSize={8}
              />
              <Bar 
                dataKey="purchases" 
                name="Purchases" 
                fill="#EC4899" 
                radius={[4, 4, 0, 0]}
                barSize={8}
              />
              {showForecast && (
                <ReferenceLine x={chartData[chartData.length - 1].displayDate} stroke="#888" strokeDasharray="3 3" label={{ value: 'Forecast Start', position: 'insideTopRight', fill: '#888', fontSize: 12 }} />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      }
      
      // Composed chart (most advanced)
      if (chartType === "composed") {
        return (
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
                iconSize={8}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="sales" 
                name="Sales" 
                stroke="#6366F1" 
                fill="#6366F1"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="purchases" 
                name="Purchases" 
                stroke="#EC4899" 
                fill="#EC4899"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Bar 
                yAxisId="right"
                dataKey="transactions" 
                name="Transactions" 
                fill="#14B8A6" 
                radius={[4, 4, 0, 0]}
                barSize={6}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="profit" 
                name="Profit" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              {showForecast && (
                <ReferenceLine x={chartData[chartData.length - 1].displayDate} stroke="#888" strokeDasharray="3 3" label={{ value: 'Forecast Start', position: 'insideTopRight', fill: '#888', fontSize: 12 }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        );
      }
    }
    
    // Profit chart
    if (activeTab === "profit") {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
              iconSize={8}
            />
            <Bar 
              dataKey="profit" 
              name="Daily Profit" 
              fill="#10B981" 
              radius={[4, 4, 0, 0]}
              barSize={10}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              name="Profit Trend" 
              stroke="#059669" 
              strokeWidth={2}
              dot={false}
            />
            <ReferenceLine y={0} stroke="#888" />
            {showForecast && (
              <ReferenceLine x={chartData[chartData.length - 1].displayDate} stroke="#888" strokeDasharray="3 3" label={{ value: 'Forecast Start', position: 'insideTopRight', fill: '#888', fontSize: 12 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    
    // Fallback
    return <div className="h-80 flex items-center justify-center">No data available</div>;
  };

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <CardTitle className="text-xl font-semibold">Sales & Inventory Analytics</CardTitle>
          
          <div className="flex flex-wrap gap-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-2 w-full sm:w-auto">
                <TabsTrigger value="sales">Sales & Purchases</TabsTrigger>
                <TabsTrigger value="profit">Profit Analysis</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex gap-2">
              <Button 
                variant={chartType === "area" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setChartType("area")}
                className="px-2 py-1 h-auto"
              >
                Area
              </Button>
              <Button 
                variant={chartType === "line" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setChartType("line")}
                className="px-2 py-1 h-auto"
              >
                Line
              </Button>
              <Button 
                variant={chartType === "bar" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setChartType("bar")}
                className="px-2 py-1 h-auto"
              >
                Bar
              </Button>
              <Button 
                variant={chartType === "composed" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setChartType("composed")}
                className="px-2 py-1 h-auto"
              >
                Advanced
              </Button>
            </div>
            
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-0">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <h3 className="text-xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                DH {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </CardContent>
          </Card>
          
          <Card className="bg-pink-50 dark:bg-pink-900/20 border-0">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <h3 className="text-xl font-bold mt-1 text-pink-600 dark:text-pink-400">
                DH {totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 dark:bg-green-900/20 border-0">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <h3 className="text-xl font-bold mt-1 text-green-600 dark:text-green-400">
                DH {profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Margin: {totalSales > 0 ? ((profit / totalSales) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>
        
        {renderChart()}
        
        <div className="flex justify-end mt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm"
            onClick={() => window.location.href = '/reports'}
          >
            View Detailed Reports
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
