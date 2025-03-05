"use client"

import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart"

interface AdvancedTooltipChartProps {
  title: React.ReactNode
  description?: React.ReactNode
  data: Array<{
    date: string
    [key: string]: string | number
  }>
  config: ChartConfig
  className?: string
}

// Define types for tooltip props and payload
interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  color: string;
  name: string;
  payload: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  config: ChartConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  label?: any;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, config }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <div className="flex flex-col gap-2">
        {payload.map((entry) => {
          const key = entry.dataKey;
          const value = entry.value;
          const total = payload.reduce((acc, p) => {
            return acc + (typeof p.value === 'number' ? p.value : 0);
          }, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
          
          return (
            <div key={key} className="flex items-center gap-2">
              <div
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-foreground font-medium">{config[key]?.label || key}</span>
              <span className="text-muted-foreground text-xs">({percentage}%)</span>
              <span className="ml-auto font-mono font-medium">
                {typeof value === 'number' ? value.toLocaleString() : value}
                <span className="text-muted-foreground ml-1 font-normal">units</span>
              </span>
            </div>
          );
        })}
        
        {/* Total row */}
        <div className="mt-2 pt-2 border-t flex items-center justify-between">
          <span className="font-medium">Total:</span>
          <span className="font-mono font-medium">
            {payload.reduce((acc, p) => {
              return acc + (typeof p.value === 'number' ? p.value : 0);
            }, 0).toLocaleString()}
            <span className="text-muted-foreground ml-1 font-normal">units</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export function AdvancedTooltipChart({
  title,
  description,
  data,
  config,
  className,
}: AdvancedTooltipChartProps) {
  const dataKeys = Object.keys(config).filter(key => key !== 'label')
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description || "Tooltip with custom formatter and total."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => {
                  if (typeof value === 'string' && value.includes('-')) {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      weekday: "short",
                    });
                  }
                  return value;
                }}
              />
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={`var(--color-${key})`}
                  radius={index === 0 ? [0, 0, 4, 4] : [4, 4, 0, 0]}
                />
              ))}
              <Tooltip 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content={(props: any) => <CustomTooltip {...props} config={config} />}
                cursor={false}
                wrapperStyle={{ zIndex: 100 }}
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
