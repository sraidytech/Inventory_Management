"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, ResponsiveContainer } from "recharts"

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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface CustomLabelBarChartProps {
  title: React.ReactNode
  description?: React.ReactNode
  data: Array<{
    month: string
    [key: string]: string | number
  }>
  config: ChartConfig
  footer?: React.ReactNode
  className?: string
  primaryDataKey?: string
}

export function CustomLabelBarChart({
  title,
  description,
  data,
  config,
  footer,
  className,
  primaryDataKey = "desktop",
}: CustomLabelBarChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              margin={{
                right: 16,
              }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <YAxis
                dataKey="month"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => {
                  if (typeof value === 'string' && value.includes('-')) {
                    // If it's a date string like "2024-03-01"
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }
                  // Fallback for other formats
                  return typeof value === 'string' ? value.slice(0, 3) : value;
                }}
                hide
              />
              <XAxis dataKey={primaryDataKey} type="number" hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent 
                    indicator="line" 
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
              />
              <Bar
                dataKey={primaryDataKey}
                layout="vertical"
                fill={`var(--color-${primaryDataKey})`}
                radius={4}
              >
                <LabelList
                  dataKey="month"
                  position="insideLeft"
                  offset={8}
                  className="fill-[--color-label]"
                  fontSize={12}
                />
                <LabelList
                  dataKey={primaryDataKey}
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      {footer && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}

export function DefaultCustomLabelBarChartFooter({ 
  trendPercentage = 5.2,
  trendDirection = "up",
  dateRange = "the last 6 months"
}: { 
  trendPercentage?: number;
  trendDirection?: "up" | "down";
  dateRange?: string;
}) {
  return (
    <>
      <div className="flex gap-2 font-medium leading-none">
        Trending {trendDirection} by {trendPercentage}% this month 
        {trendDirection === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 rotate-180" />}
      </div>
      <div className="leading-none text-muted-foreground">
        Showing total visitors for {dateRange}
      </div>
    </>
  )
}
