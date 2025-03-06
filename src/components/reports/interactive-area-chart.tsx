"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig } from "@/components/ui/chart"
import { CustomTooltip } from "./shared-chart-components"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface InteractiveAreaChartProps {
  title: React.ReactNode
  description?: React.ReactNode
  data: Array<{
    date: string
    [key: string]: string | number
  }>
  config: ChartConfig
  className?: string
}

export function InteractiveAreaChart({
  title,
  description,
  data,
  config,
  className,
}: InteractiveAreaChartProps) {
  const [timeRange, setTimeRange] = React.useState("90d")

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const date = new Date(item.date)
      const referenceDate = new Date(data[data.length - 1].date)
      let daysToSubtract = 90
      if (timeRange === "30d") {
        daysToSubtract = 30
      } else if (timeRange === "7d") {
        daysToSubtract = 7
      }
      const startDate = new Date(referenceDate)
      startDate.setDate(startDate.getDate() - daysToSubtract)
      return date >= startDate
    })
  }, [data, timeRange])

  // Get colors from config
  const getColorForKey = (key: string): string => {
    return config[key]?.color || `hsl(var(--chart-${Object.keys(config).indexOf(key) + 1}))`
  }

  return (
    <Card className={className}>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {description || "Showing data over time"}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a time range"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="aspect-auto h-[250px] w-full">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={filteredData}>
              <defs>
                {Object.keys(config).filter(key => key !== 'label').map((key) => (
                  <linearGradient key={key} id={`fill${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={getColorForKey(key)}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={getColorForKey(key)}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value: string) => {
                  if (typeof value === 'string' && value.includes('-')) {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }
                  return value;
                }}
              />
              <Tooltip
                cursor={false}
                content={
                  <CustomTooltip 
                    active={false} // This will be overridden by Recharts
                    payload={[]} // This will be overridden by Recharts
                    indicator="dot"
                    labelFormatter={(value) => {
                      if (typeof value === 'string' && value.includes('-')) {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
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
                  fill={`url(#fill${key})`}
                  stroke={getColorForKey(key)}
                  stackId="a"
                />
              ))}
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
                iconSize={8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
