"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface AreaChartProps {
  title: React.ReactNode
  description?: React.ReactNode
  data: Array<Record<string, string | number>>
  config: ChartConfig
  footer?: React.ReactNode
  className?: string
  stacked?: boolean
}

export function AreaChartStacked({
  title,
  description,
  data,
  config,
  footer,
  className,
  stacked = true,
}: AreaChartProps) {
  console.log("AreaChartStacked rendering with data:", data);
  console.log("AreaChartStacked config:", config);
  console.log("AreaChartStacked config keys:", Object.keys(config).filter(key => key !== 'label'));
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description || "Showing data for the last 6 months"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  if (typeof value === 'string' && value.includes('-')) {
                    // If it's a date string like "2024-03-01"
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }
                  // Fallback for other formats
                  return typeof value === 'string' ? value.slice(0, 3) : value;
                }}
              />
              <Tooltip
                cursor={false}
                content={
                  <ChartTooltipContent 
                    indicator="dot" 
                    labelFormatter={(value) => {
                      if (typeof value === 'string' && value.includes('-')) {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { 
                          weekday: 'short',
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        });
                      }
                      return value;
                    }}
                  />
                }
                wrapperStyle={{ zIndex: 100 }}
                isAnimationActive={true}
              />
              {Object.keys(config).filter(key => key !== 'label').map((key) => {
                console.log(`Adding Area for key ${key} with fill var(--color-${key})`);
                return (
                  <Area
                    key={key}
                    dataKey={key}
                    type="natural"
                    fill={`var(--color-${key})`}
                    fillOpacity={0.4}
                    stroke={`var(--color-${key})`}
                    stackId={stacked ? "a" : undefined}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      {footer && (
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              {footer}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

export function DefaultAreaChartFooter({ 
  trendPercentage = 5.2,
  trendDirection = "up",
  dateRange = "January - June 2024"
}: { 
  trendPercentage?: number;
  trendDirection?: "up" | "down";
  dateRange?: string;
}) {
  return (
    <>
      <div className="flex items-center gap-2 font-medium leading-none">
        Trending {trendDirection} by {trendPercentage}% this month 
        {trendDirection === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 rotate-180" />}
      </div>
      <div className="flex items-center gap-2 leading-none text-muted-foreground">
        {dateRange}
      </div>
    </>
  )
}
