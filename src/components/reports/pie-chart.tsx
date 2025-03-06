"use client"

import * as React from "react"
import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import { CustomTooltip } from "./shared-chart-components"

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
  // config is used in the interface but not in the implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config,
  footer,
  className,
}: PieChartProps) {
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
        <div className="mx-auto aspect-square max-h-[250px]">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Tooltip
                cursor={false}
                content={
                  <CustomTooltip 
                    active={false} // This will be overridden by Recharts
                    payload={[]} // This will be overridden by Recharts
                    hideLabel 
                    valuePrefix=""
                    valueSuffix=""
                    formatter={(value, name, item) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                          style={
                            {
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              "--color-bg": (item as any).fill,
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
                  fill: item.fill || `hsl(var(--chart-${data.indexOf(item) + 1}))`
                }))}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
                cx="50%"
                cy="50%"
                outerRadius={80}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                iconSize={8}
              />
              {/* Center label */}
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-3xl font-bold"
              >
                {totalValue.toLocaleString()}
              </text>
              <text
                x="50%"
                y="50%"
                dy={24}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground"
              >
                Total
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      {footer && (
        <CardFooter className="flex-col gap-2 text-sm">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
