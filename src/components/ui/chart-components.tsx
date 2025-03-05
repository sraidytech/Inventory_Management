"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Define a more specific type for chart data items
interface ChartDataItem {
  name: string;
  value: number;
  color?: string;
  [key: string]: unknown;
}

export interface ChartConfig {
  [key: string]: {
    label: string
    color?: string
  }
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: ChartContainerProps) {
  const cssVars = React.useMemo(() => {
    const vars: Record<string, string> = {}
    Object.entries(config).forEach(([key, value]) => {
      if (value.color) {
        vars[`--color-${key}`] = value.color
      }
    })
    return vars
  }, [config])

  return (
    <div
      className={cn("h-full w-full", className)}
      style={cssVars as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  )
}

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean
  payload?: ChartDataItem[]
  label?: string
  formatter?: (value: number, name: string, item: ChartDataItem, index: number) => React.ReactNode
  labelFormatter?: (value: string) => React.ReactNode
  valuePrefix?: string
  valueSuffix?: string
  indicator?: "dot" | "line" | "dashed"
  hideLabel?: boolean
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  valuePrefix = "",
  valueSuffix = "",
  indicator = "line",
  hideLabel = false,
  className,
  ...props
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-2 shadow-md",
        className
      )}
      {...props}
    >
      {!hideLabel && (
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          {labelFormatter ? labelFormatter(label as string) : label}
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        {payload.map((item, index) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs">
            {formatter ? (
              formatter(item.value, item.name, item, index)
            ) : (
              <>
                {indicator === "dot" && (
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                {indicator === "line" && (
                  <div
                    className="h-0.5 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                {indicator === "dashed" && (
                  <div
                    className="h-0.5 w-2 shrink-0 rounded-full border-b-2"
                    style={{ borderBottomStyle: "dashed", borderColor: item.color }}
                  />
                )}
                <span className="text-muted-foreground">
                  {item.name}:
                </span>
                <span className="font-medium text-foreground">
                  {valuePrefix}
                  {typeof item.value === "number"
                    ? item.value.toLocaleString()
                    : item.value}
                  {valueSuffix}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export const ChartTooltip = ({ content, ...props }: { content: React.ReactNode; [key: string]: unknown }) => {
  return <div {...props}>{content}</div>
}

interface ChartLegendContentProps extends React.HTMLAttributes<HTMLDivElement> {
  payload?: ChartDataItem[]
}

export function ChartLegendContent({
  payload,
  className,
  ...props
}: ChartLegendContentProps) {
  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn("flex flex-wrap items-center gap-4", className)}
      {...props}
    >
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export const ChartLegend = ({ content, ...props }: { content: React.ReactNode; [key: string]: unknown }) => {
  return <div {...props}>{content}</div>
}
