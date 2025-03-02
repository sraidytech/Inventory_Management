"use client";

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend,
  TooltipProps,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

// Custom tooltip component for better styling
const CustomTooltip = ({ active, payload, label, valuePrefix = "DH" }: TooltipProps<number, string> & { valuePrefix?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-1">{label || payload[0]?.name}</p>
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

interface Client {
  id: string;
  name: string;
  totalDue: number;
  amountPaid: number;
  balance: number;
}

interface CreditReportProps {
  clientsWithBalance: number;
  totalClientBalance: number;
  pendingReceivables: number;
  pendingPayables: number;
  topClients?: Client[];
}

export function CreditReport({ 
  clientsWithBalance, 
  totalClientBalance,
  pendingReceivables,
  pendingPayables,
  topClients = []
}: CreditReportProps) {
  // Prepare data for the pie chart
  const pieData = [
    { name: 'Receivables', value: pendingReceivables },
    { name: 'Payables', value: pendingPayables },
  ];

  // Modern color palette
  const COLORS = ["#8B5CF6", "#EC4899"];

  // Prepare data for the bar chart
  const barData = topClients.slice(0, 5).map(client => ({
    name: client.name,
    balance: client.balance,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-muted-foreground">Clients with Balance</p>
          <h3 className="text-2xl font-bold mt-1 text-purple-600">{clientsWithBalance}</h3>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-muted-foreground">Total Outstanding Balance</p>
          <h3 className="text-2xl font-bold mt-1 text-pink-600">DH {totalClientBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receivables vs Payables */}
        <div>
          <h3 className="text-base font-medium mb-4">Receivables vs Payables</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Top Clients by Balance */}
        <div>
          <h3 className="text-base font-medium mb-4">Top Clients by Balance</h3>
          <div className="h-64">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="balance" 
                    name="Balance" 
                    fill="#8B5CF6" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No client data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
