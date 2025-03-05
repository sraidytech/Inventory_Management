"use client"

import * as React from "react"
import { Label, Pie, PieChart, ResponsiveContainer } from "recharts"

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

interface PieChartProps {
  title: React.ReactNode
  description?: React.ReactNode
  data: Array<{
    name: string
    value: number
    fill: string
  }>
  config: ChartConfig
  footer?: React.ReactNode
  className?: string
}

export function PieChartDonut({
  title,
  description,
  data,
  config,
  footer,
  className,
}: PieChartProps) {
  console.log("PieChartDonut rendering with data:", data);
  console.log("PieChartDonut config:", config);
  
  // Add debugging for the fill property
  console.log("PieChartDonut data with fill:", data.map(item => ({
    ...item,
    fill: item.fill || 'none'
  })));
  
  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0)
  }, [data])

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent 
                    hideLabel 
                    valuePrefix=""
                    valueSuffix=""
                    formatter={(value, name, item) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                          style={
                            {
                              "--color-bg": item.fill,
                            } as React.CSSProperties
                          }
                        />
                        <span className="text-muted-foreground">{name}:</span>
                        <span className="ml-auto font-medium text-foreground">
                          {value.toLocaleString()}
                        </span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({((value / totalValue) * 100).toFixed(1)}%)
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Pie
                data={data.map(item => ({
                  ...item,
                  // Ensure fill is set
                  fill: item.fill || `var(--color-${item.name.toLowerCase().replace(/\s+/g, '-')})` || 'hsl(var(--chart-1))'
                }))}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalValue.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Total
                          </tspan>
                        </text>
                      )
                    }
                    return null
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      {footer && (
        <CardFooter className="flex-col gap-2 text-sm">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
