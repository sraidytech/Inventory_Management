"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"

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
import { TranslatedText } from "@/components/language/translated-text"

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
  // Get colors from config
  const getColorForKey = (key: string): string => {
    return config[key]?.color || `hsl(var(--chart-${Object.keys(config).indexOf(key) + 1}))`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description || "Showing data for the last 6 months"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
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
                  <CustomTooltip 
                    active={false} // This will be overridden by Recharts
                    payload={[]} // This will be overridden by Recharts
                    indicator="dot"
                    formatter={(value, name) => (
                      <>
                        <span className="text-muted-foreground">
                          {typeof name === 'string' && name.includes('.') ? (
                            <>
                              <TranslatedText 
                                namespace={name.split('.')[0]} 
                                id={name.split('.')[1]} 
                              />:
                            </>
                          ) : (
                            `${name}:`
                          )}
                        </span>
                        <span className="ml-auto font-medium text-foreground">
                          {typeof value === 'number' ? value.toLocaleString() : value}
                        </span>
                      </>
                    )}
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
                <Area
                  key={key}
                  dataKey={key}
                  name={config[key]?.label || key}
                  type="natural"
                  fill={getColorForKey(key)}
                  fillOpacity={0.4}
                  stroke={getColorForKey(key)}
                  stackId={stacked ? "a" : undefined}
                />
              ))}
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => {
                  // Check if the value is a translation key
                  if (typeof value === 'string' && value.includes('.')) {
                    const [namespace, key] = value.split('.');
                    if (namespace && key) {
                      return <TranslatedText namespace={namespace} id={key} />;
                    }
                  }
                  return value;
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
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
        <TranslatedText namespace="reports" id={trendDirection === "up" ? "trendingUp" : "trendingDown"} /> {trendPercentage}% <TranslatedText namespace="reports" id="thisMonth" />
        {trendDirection === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 rotate-180" />}
      </div>
      <div className="flex items-center gap-2 leading-none text-muted-foreground">
        {dateRange}
      </div>
    </>
  )
}
