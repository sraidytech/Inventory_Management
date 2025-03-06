"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig } from "@/components/ui/chart"
import { CustomTooltip } from "./shared-chart-components"

interface BarChartProps {
  title: React.ReactNode
  description?: React.ReactNode
  data: Array<Record<string, string | number>>
  config: ChartConfig
  footer?: React.ReactNode
  className?: string
}

export function BarChartMultiple({
  title,
  description,
  data,
  config,
  footer,
  className,
}: BarChartProps) {
  // Get colors from config
  const getColorForKey = (key: string): string => {
    return config[key]?.color || `hsl(var(--chart-${Object.keys(config).indexOf(key) + 1}))`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey="month"
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
              />
              <Tooltip
                cursor={false}
                content={
                  <CustomTooltip 
                    active={false} // This will be overridden by Recharts
                    payload={[]} // This will be overridden by Recharts
                    indicator="dashed" 
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
              {Object.keys(config).filter(key => key !== 'label').map((key) => (
                <Bar 
                  key={key}
                  dataKey={key} 
                  name={config[key]?.label || key}
                  fill={getColorForKey(key)} 
                  radius={4} 
                />
              ))}
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
                iconSize={8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      {footer && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}

export function DefaultBarChartFooter({ 
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
