"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/language/language-provider";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranslatedText } from "@/components/language/translated-text";
import { DashboardLoading, DashboardError } from "@/components/dashboard/loading";
import { RefreshCw } from "lucide-react";

// Import our new chart components
import { PieChartDonut } from "@/components/reports/pie-chart";
import { BarChartMultiple, DefaultBarChartFooter } from "@/components/reports/bar-chart";
import { AreaChartStacked, DefaultAreaChartFooter } from "@/components/reports/area-chart";
import { InteractiveAreaChart } from "@/components/reports/interactive-area-chart";
import { CustomLabelBarChart, DefaultCustomLabelBarChartFooter } from "@/components/reports/custom-label-bar-chart";
import { AdvancedTooltipChart } from "@/components/reports/advanced-tooltip-chart";

// Report types
const REPORT_TYPES = {
  SALES: "sales",
  INVENTORY: "inventory",
  PRODUCTS: "products",
  SUPPLIERS: "suppliers",
  CLIENTS: "clients",
  PROFIT: "profit",
};

// Chart configurations with translation keys
const salesChartConfig = {
  sales: {
    label: "reports.sales",
    color: "hsl(var(--chart-1))",
  },
  transactions: {
    label: "reports.transactions",
    color: "hsl(var(--chart-2))",
  },
};

const inventoryChartConfig = {
  inStock: {
    label: "reports.inStock",
    color: "hsl(var(--chart-1))",
  },
  lowStock: {
    label: "reports.lowStock",
    color: "hsl(var(--chart-2))",
  },
  outOfStock: {
    label: "reports.outOfStock",
    color: "hsl(var(--chart-3))",
  },
};

const profitChartConfig = {
  revenue: {
    label: "reports.revenue",
    color: "hsl(var(--chart-1))",
  },
  cost: {
    label: "reports.cost",
    color: "hsl(var(--chart-2))",
  },
  profit: {
    label: "reports.profit",
    color: "hsl(var(--chart-3))",
  },
};

const pieChartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
  firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))",
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
  label: {
    label: "Label",
    color: "hsl(var(--background))",
  },
};

// Colors for charts
const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-6))'];

export default function ReportsPage() {
  const { isRTL } = useLanguage();
  
  // Initialize with today's date and 14 days ago for reports
  const today = new Date().toISOString().split('T')[0];
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13); // -13 to include today (total of 14 days)
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0];
  
  // State for date range
  const [startDate, setStartDate] = useState<string>(fourteenDaysAgoStr);
  const [endDate, setEndDate] = useState<string>(today);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState(REPORT_TYPES.SALES);
  
  // These filter states are kept for API compatibility but not used in UI
  const [clientFilter] = useState<string>("all");
  const [productFilter] = useState<string>("all");
  const [supplierFilter] = useState<string>("all");
  const [searchQuery] = useState<string>("");
  
  // State for data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  interface SalesDataPoint {
    date: string;
    sales: number;
    transactions: number;
    revenue?: number;
    cost?: number;
    profit?: number;
  }

  interface InventoryDataPoint {
    date: string;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  }

  interface PieChartDataPoint {
    name: string;
    value: number;
  }

  interface ProfitDataPoint {
    date: string;
    revenue: number;
    cost: number;
    profit: number;
  }

  interface FilterItem {
    id: string;
    name: string;
  }

  // State for report data
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryDataPoint[]>([]);
  const [productData, setProductData] = useState<PieChartDataPoint[]>([]);
  const [supplierData, setSupplierData] = useState<PieChartDataPoint[]>([]);
  const [clientData, setClientData] = useState<PieChartDataPoint[]>([]);
  const [profitData, setProfitData] = useState<ProfitDataPoint[]>([]);
  
  // These filter lists are not used in the UI since we removed the filter section
  // But we keep the state for future implementation
  const [, setClients] = useState<FilterItem[]>([]);
  const [, setProducts] = useState<FilterItem[]>([]);
  const [, setSuppliers] = useState<FilterItem[]>([]);

  // Fetch report data
  const fetchReportData = async () => {
    console.log("Fetching report data...");
    setRefreshing(true);
    try {
      // Fetch clients, products, and suppliers for filters
      const [clientsResponse, productsResponse, suppliersResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/products'),
        fetch('/api/suppliers')
      ]);
      
      if (!clientsResponse.ok || !productsResponse.ok || !suppliersResponse.ok) {
        throw new Error("Failed to fetch filter data");
      }
      
      const clientsData = await clientsResponse.json();
      const productsData = await productsResponse.json();
      const suppliersData = await suppliersResponse.json();
      
      // Set filter data
      setClients(clientsData.data?.items || []);
      setProducts(productsData.data?.items || []);
      setSuppliers(suppliersData.suppliers || []);
      
      // Fetch data for the active tab
      await fetchTabData(activeTab);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
      console.error("Error fetching report data:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch data for a specific tab
  const fetchTabData = async (tabType: string) => {
    console.log(`Fetching data for tab: ${tabType}`);
    try {
      // Build URL with date range
      const url = new URL('/api/reports', window.location.origin);
      url.searchParams.append('startDate', startDate);
      url.searchParams.append('endDate', endDate);
      url.searchParams.append('type', tabType);
      
      // Add filters if applicable
      if (clientFilter !== 'all') url.searchParams.append('clientId', clientFilter);
      if (productFilter !== 'all') url.searchParams.append('productId', productFilter);
      if (supplierFilter !== 'all') url.searchParams.append('supplierId', supplierFilter);
      if (searchQuery) url.searchParams.append('search', searchQuery);
      
      console.log("Fetching with URL:", url.toString());
      console.log("Filters:", { clientFilter, productFilter, supplierFilter, searchQuery });
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${tabType} data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Data received for ${tabType}:`, data);
      
      if (!data.success) {
        throw new Error(data.error || `Failed to fetch ${tabType} data`);
      }
      
      // Get the data from the response
      const filteredData = data;
      
      // Update state based on tab type
      switch (tabType) {
        case REPORT_TYPES.SALES:
          console.log("Setting sales data:", filteredData.data.timeSeriesData || []);
          setSalesData(filteredData.data.timeSeriesData || []);
          setProfitData(filteredData.data.timeSeriesData || []); // Profit data comes from the same endpoint
          break;
        case REPORT_TYPES.INVENTORY:
          setInventoryData(filteredData.data.timeSeriesData || []);
          break;
        case REPORT_TYPES.PRODUCTS:
          setProductData(filteredData.data.productData || []);
          break;
        case REPORT_TYPES.SUPPLIERS:
          setSupplierData(filteredData.data.supplierData || []);
          break;
        case REPORT_TYPES.CLIENTS:
          setClientData(filteredData.data.clientData || []);
          break;
        case REPORT_TYPES.PROFIT:
          // Profit data is already fetched with sales data
          break;
      }
    } catch (err) {
      console.error(`Error fetching ${tabType} data:`, err);
      // Don't set error state here to avoid blocking the UI
      // Just log the error and continue
    }
  };

  // Initialize with sample data for testing
  useEffect(() => {
    // Sample sales data
    const sampleSalesData = [
      { date: "2024-03-01", sales: 5000, transactions: 20, revenue: 5000, cost: 3000, profit: 2000 },
      { date: "2024-03-02", sales: 6000, transactions: 25, revenue: 6000, cost: 3500, profit: 2500 },
      { date: "2024-03-03", sales: 4500, transactions: 18, revenue: 4500, cost: 2800, profit: 1700 },
      { date: "2024-03-04", sales: 7000, transactions: 30, revenue: 7000, cost: 4000, profit: 3000 },
      { date: "2024-03-05", sales: 5500, transactions: 22, revenue: 5500, cost: 3200, profit: 2300 },
    ];
    
    // Sample inventory data
    const sampleInventoryData = [
      { date: "2024-03-01", inStock: 500, lowStock: 50, outOfStock: 10 },
      { date: "2024-03-02", inStock: 480, lowStock: 55, outOfStock: 12 },
      { date: "2024-03-03", inStock: 510, lowStock: 48, outOfStock: 8 },
      { date: "2024-03-04", inStock: 490, lowStock: 52, outOfStock: 15 },
      { date: "2024-03-05", inStock: 520, lowStock: 45, outOfStock: 5 },
    ];
    
    // Sample product data
    const sampleProductData = [
      { name: "Product A", value: 400 },
      { name: "Product B", value: 300 },
      { name: "Product C", value: 300 },
      { name: "Product D", value: 200 },
      { name: "Product E", value: 100 },
    ];
    
    // Sample supplier data
    const sampleSupplierData = [
      { name: "Supplier A", value: 400 },
      { name: "Supplier B", value: 300 },
      { name: "Supplier C", value: 300 },
      { name: "Supplier D", value: 200 },
      { name: "Supplier E", value: 100 },
    ];
    
    // Sample client data
    const sampleClientData = [
      { name: "Client A", value: 400 },
      { name: "Client B", value: 300 },
      { name: "Client C", value: 300 },
      { name: "Client D", value: 200 },
      { name: "Client E", value: 100 },
    ];
    
    // Set sample data
    setSalesData(sampleSalesData);
    setInventoryData(sampleInventoryData);
    setProductData(sampleProductData);
    setSupplierData(sampleSupplierData);
    setClientData(sampleClientData);
    setProfitData(sampleSalesData);
    
    // Set loading to false
    setIsLoading(false);
    
    console.log("Sample data loaded:", {
      salesData: sampleSalesData,
      inventoryData: sampleInventoryData,
      productData: sampleProductData,
      supplierData: sampleSupplierData,
      clientData: sampleClientData
    });
    
    // Fetch real data
    fetchReportData();
  }, []);
  
  // Fetch data for the active tab when it changes or when filters change
  useEffect(() => {
    if (!isLoading && !refreshing) {
      fetchTabData(activeTab);
    }
  }, [activeTab, clientFilter, productFilter, supplierFilter, searchQuery, startDate, endDate]);

  // Handle date range changes
  const handleDateRangeApply = (newStartDate?: string, newEndDate?: string) => {
    if (newStartDate) setStartDate(newStartDate);
    if (newEndDate) setEndDate(newEndDate);
    fetchReportData();
  };

  const handleDateRangeClear = () => {
    setStartDate(fourteenDaysAgoStr);
    setEndDate(today);
    fetchReportData();
  };

  // Filter change handler removed as filters UI was removed

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Data will be fetched by the useEffect hook
  };

  if (isLoading && !refreshing) return <DashboardLoading />;
  if (error) return <DashboardError message={error.message} />;

  return (
    <div className="p-6 space-y-6">
      {/* Reports Header with Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">
            <TranslatedText namespace="common" id="detailedReports" />
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchReportData()}
            disabled={isLoading || refreshing}
            className={`${isRTL ? 'mr-2' : 'ml-2'}`}
          >
            <RefreshCw className={`h-4 w-4 ${(isLoading || refreshing) ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onApply={handleDateRangeApply}
            onClear={handleDateRangeClear}
          />
        </div>
      </div>

      {/* Filters removed as they were not working properly */}

      {/* Report Tabs */}
      <Tabs defaultValue={REPORT_TYPES.SALES} value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
          <TabsTrigger value={REPORT_TYPES.SALES}>
            <TranslatedText namespace="reports" id="salesReport" />
          </TabsTrigger>
          <TabsTrigger value={REPORT_TYPES.INVENTORY}>
            <TranslatedText namespace="reports" id="inventoryReport" />
          </TabsTrigger>
          <TabsTrigger value={REPORT_TYPES.PRODUCTS}>
            <TranslatedText namespace="reports" id="productsReport" />
          </TabsTrigger>
          <TabsTrigger value={REPORT_TYPES.SUPPLIERS}>
            <TranslatedText namespace="reports" id="suppliersReport" />
          </TabsTrigger>
          <TabsTrigger value={REPORT_TYPES.CLIENTS}>
            <TranslatedText namespace="reports" id="clientsReport" />
          </TabsTrigger>
          <TabsTrigger value={REPORT_TYPES.PROFIT}>
            <TranslatedText namespace="reports" id="profitReport" />
          </TabsTrigger>
        </TabsList>
        
        {/* Sales Report */}
        <TabsContent value={REPORT_TYPES.SALES} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AreaChartStacked
              title={<TranslatedText namespace="reports" id="salesOverTime" />}
              description={<TranslatedText namespace="reports" id="salesOverTimeDesc" />}
              data={salesData.map(item => ({
                month: item.date,
                sales: item.sales
              }))}
              config={salesChartConfig}
              footer={
                <DefaultAreaChartFooter 
                  trendPercentage={4.8} 
                  trendDirection="up"
                  dateRange={`${startDate} - ${endDate}`}
                />
              }
            />
            
            <BarChartMultiple
              title={<TranslatedText namespace="reports" id="salesTransactions" />}
              description={<TranslatedText namespace="reports" id="numberOfTransactions" />}
              data={salesData.map(item => ({
                month: item.date,
                transactions: item.transactions
              }))}
              config={salesChartConfig}
              footer={
                <DefaultBarChartFooter 
                  trendPercentage={3.7} 
                  trendDirection="up"
                  dateRange={`${startDate} - ${endDate}`}
                />
              }
            />
          </div>
          
          <InteractiveAreaChart
            title={<TranslatedText namespace="reports" id="salesAnalytics" />}
            description={<TranslatedText namespace="reports" id="interactiveSalesData" />}
            data={salesData.map(item => ({
              date: item.date,
              sales: item.sales,
              transactions: item.transactions
            }))}
            config={salesChartConfig}
          />
        </TabsContent>
        
        {/* Inventory Report */}
        <TabsContent value={REPORT_TYPES.INVENTORY} className="space-y-4">
          <AreaChartStacked
            title={<TranslatedText namespace="reports" id="inventoryStatus" />}
            description={<TranslatedText namespace="reports" id="inventoryStatusOverTime" />}
            data={inventoryData.map(item => ({
              month: item.date,
              inStock: item.inStock,
              lowStock: item.lowStock,
              outOfStock: item.outOfStock
            }))}
            config={inventoryChartConfig}
            footer={
              <DefaultAreaChartFooter 
                trendPercentage={2.9} 
                trendDirection="up"
                dateRange={`${startDate} - ${endDate}`}
              />
            }
          />
          
          <div className="grid gap-4 md:grid-cols-2">
            <CustomLabelBarChart
              title={<TranslatedText namespace="reports" id="stockLevelsByMonth" />}
              description={<TranslatedText namespace="reports" id="monthlyInventoryLevels" />}
              data={inventoryData.map(item => ({
                month: item.date,
                desktop: item.inStock
              }))}
              config={{
                desktop: {
                  label: "reports.inStock",
                  color: "hsl(var(--chart-1))",
                },
                label: {
                  label: "reports.label",
                  color: "hsl(var(--background))",
                },
              }}
              footer={
                <DefaultCustomLabelBarChartFooter 
                  trendPercentage={1.8} 
                  trendDirection="up"
                  dateRange={`${startDate} - ${endDate}`}
                />
              }
            />
            
            <AdvancedTooltipChart
              title={<TranslatedText namespace="reports" id="stockDistribution" />}
              description={<TranslatedText namespace="reports" id="detailedInventoryBreakdown" />}
              data={inventoryData.map(item => ({
                date: item.date,
                running: item.inStock,
                swimming: item.lowStock
              }))}
              config={{
                running: {
                  label: "reports.inStock",
                  color: "hsl(var(--chart-1))",
                },
                swimming: {
                  label: "reports.lowStock",
                  color: "hsl(var(--chart-2))",
                },
              }}
            />
          </div>
        </TabsContent>
        
        {/* Products Report */}
        <TabsContent value={REPORT_TYPES.PRODUCTS} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Debug log for product data */}
            {(() => {
              console.log("Rendering Products Report with data:", productData);
              return null;
            })()}
            
            {productData.length > 0 ? (
              <PieChartDonut
                title={<TranslatedText namespace="reports" id="topProducts" />}
                description={<TranslatedText namespace="reports" id="topProductsBySalesValue" />}
                data={productData.map((item, index) => ({
                  name: item.name,
                  value: item.value,
                  fill: COLORS[index % COLORS.length]
                }))}
                config={pieChartConfig}
                footer={
                  <div className="font-medium leading-none">
                    <TranslatedText namespace="reports" id="topProductsBySalesValue" />
                  </div>
                }
              />
            ) : (
              <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                  <CardTitle><TranslatedText namespace="reports" id="topProducts" /></CardTitle>
                  <CardDescription>No data available</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[250px]">
                  <p className="text-muted-foreground">No product data available</p>
                </CardContent>
              </Card>
            )}
            
            <BarChartMultiple
              title={<TranslatedText namespace="reports" id="productPerformance" />}
              description={<TranslatedText namespace="reports" id="topProductsBySalesValue" />}
              data={productData.map(item => ({
                month: item.name,
                desktop: item.value
              }))}
              config={{
                desktop: {
                  label: "reports.salesValue",
                  color: "hsl(var(--chart-1))",
                },
              }}
              footer={
                <DefaultBarChartFooter 
                  trendPercentage={3.2} 
                  trendDirection="up"
                  dateRange={`${startDate} - ${endDate}`}
                />
              }
            />
          </div>
        </TabsContent>
        
        {/* Suppliers Report */}
        <TabsContent value={REPORT_TYPES.SUPPLIERS} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PieChartDonut
              title={<TranslatedText namespace="reports" id="topSuppliers" />}
              description={<TranslatedText namespace="reports" id="topSuppliersByPurchaseValue" />}
              data={supplierData.map((item, index) => ({
                name: item.name,
                value: item.value,
                fill: COLORS[index % COLORS.length]
              }))}
              config={pieChartConfig}
              footer={
                <div className="font-medium leading-none">
                  <TranslatedText namespace="reports" id="topSuppliersByPurchaseValue" />
                </div>
              }
            />
            
            <CustomLabelBarChart
              title={<TranslatedText namespace="reports" id="supplierContributions" />}
              description={<TranslatedText namespace="reports" id="topSuppliersByPurchaseValue" />}
              data={supplierData.map(item => ({
                month: item.name,
                desktop: item.value
              }))}
              config={{
                desktop: {
                  label: "reports.purchaseValue",
                  color: "hsl(var(--chart-1))",
                },
                label: {
                  label: "reports.label",
                  color: "hsl(var(--background))",
                },
              }}
              footer={
                <DefaultCustomLabelBarChartFooter 
                  trendPercentage={2.5} 
                  trendDirection="up"
                  dateRange={`${startDate} - ${endDate}`}
                />
              }
            />
          </div>
        </TabsContent>
        
        {/* Clients Report */}
        <TabsContent value={REPORT_TYPES.CLIENTS} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PieChartDonut
              title={<TranslatedText namespace="reports" id="topClients" />}
              description={<TranslatedText namespace="reports" id="topClientsBySalesValue" />}
              data={clientData.map((item, index) => ({
                name: item.name,
                value: item.value,
                fill: COLORS[index % COLORS.length]
              }))}
              config={pieChartConfig}
              footer={
                <div className="font-medium leading-none">
                  <TranslatedText namespace="reports" id="topClientsBySalesValue" />
                </div>
              }
            />
            
            <AdvancedTooltipChart
              title={<TranslatedText namespace="reports" id="clientActivity" />}
              description={<TranslatedText namespace="reports" id="topClientsBySalesValue" />}
              data={clientData.map((item) => ({
                date: item.name,
                running: item.value,
                swimming: 0
              }))}
              config={{
                running: {
                  label: "reports.salesValue",
                  color: "hsl(var(--chart-1))",
                },
                swimming: {
                  label: "reports.hidden",
                  color: "hsl(var(--chart-2))",
                },
              }}
            />
          </div>
        </TabsContent>
        
        {/* Profit Report */}
        <TabsContent value={REPORT_TYPES.PROFIT} className="space-y-4">
          <InteractiveAreaChart
            title={<TranslatedText namespace="reports" id="profitAnalysis" />}
            description={<TranslatedText namespace="reports" id="profitAnalysisOverTime" />}
            data={profitData.map(item => ({
              date: item.date,
              revenue: item.revenue || 0,
              cost: item.cost || 0,
              profit: item.profit || 0
            }))}
            config={profitChartConfig}
          />
          
          <div className="grid gap-4 md:grid-cols-2">
            <BarChartMultiple
              title={<TranslatedText namespace="reports" id="revenueVsCost" />}
              description={<TranslatedText namespace="reports" id="monthlyFinancialBreakdown" />}
              data={profitData.map(item => ({
                month: item.date,
                desktop: item.revenue || 0,
                mobile: item.cost || 0
              }))}
              config={{
                desktop: {
                  label: "reports.revenue",
                  color: "hsl(var(--chart-1))",
                },
                mobile: {
                  label: "reports.cost",
                  color: "hsl(var(--chart-2))",
                },
              }}
              footer={
                <DefaultBarChartFooter 
                  trendPercentage={4.1} 
                  trendDirection="up"
                  dateRange={`${startDate} - ${endDate}`}
                />
              }
            />
            
            <AreaChartStacked
              title={<TranslatedText namespace="reports" id="profitTrends" />}
              description={<TranslatedText namespace="reports" id="profitAnalysisOverTime" />}
              data={profitData.map(item => ({
                month: item.date,
                desktop: (item.profit || 0) > 0 ? (item.profit || 0) : 0,
                mobile: (item.profit || 0) < 0 ? Math.abs(item.profit || 0) : 0
              }))}
              config={{
                desktop: {
                  label: "reports.profit",
                  color: "hsl(var(--chart-1))",
                },
                mobile: {
                  label: "reports.loss",
                  color: "hsl(var(--chart-2))",
                },
              }}
              stacked={false}
              footer={
                <DefaultAreaChartFooter 
                  trendPercentage={3.9} 
                  trendDirection="up"
                  dateRange={`${startDate} - ${endDate}`}
                />
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
