"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

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
  console.log("ChartContainer rendering with config:", config);
  
  const cssVars = React.useMemo(() => {
    // Default colors for common keys
    const defaultColors: Record<string, string> = {
      sales: "hsl(var(--chart-1))",
      transactions: "hsl(var(--chart-2))",
      inStock: "hsl(var(--chart-1))",
      lowStock: "hsl(var(--chart-2))",
      outOfStock: "hsl(var(--chart-3))",
      revenue: "hsl(var(--chart-1))",
      cost: "hsl(var(--chart-2))",
      profit: "hsl(var(--chart-3))",
      desktop: "hsl(var(--chart-1))",
      mobile: "hsl(var(--chart-2))",
      running: "hsl(var(--chart-1))",
      swimming: "hsl(var(--chart-2))",
      label: "hsl(var(--background))",
    };

    const vars: Record<string, string> = {}
    
    // First set default colors
    Object.entries(defaultColors).forEach(([key, color]) => {
      vars[`--color-${key}`] = color;
    });
    
    // Then override with config colors if provided
    Object.entries(config).forEach(([key, value]) => {
      if (value.color) {
        vars[`--color-${key}`] = value.color
      } else if (defaultColors[key]) {
        vars[`--color-${key}`] = defaultColors[key]
      }
    })
    
    console.log("ChartContainer cssVars:", vars);
    return vars
  }, [config])

  return (
    <div
      className={cn("h-full w-full", className)}
      style={cssVars as React.CSSProperties}
      {...props}
    >
      {/* Add inline styles directly for debugging */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          ${Object.entries(cssVars).map(([key, value]) => `${key}: ${value};`).join('\n')}
        }
      `}} />
      {children}
    </div>
  )
}

// Define a more specific type for chart data items
interface ChartDataItem {
  name: string;
  value: number;
  color?: string;
  [key: string]: unknown;
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

  // Calculate total if all values are numbers
  const allNumbers = payload.every(item => typeof item.value === 'number');
  const total = allNumbers ? payload.reduce((acc, item) => acc + (typeof item.value === 'number' ? item.value : 0), 0) : null;

  // Get percentage of each item relative to total
  const getPercentage = (value: number) => {
    if (total && total > 0) {
      return ((value / total) * 100).toFixed(1) + '%';
    }
    return '';
  };

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
                {allNumbers && total && typeof item.value === 'number' && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({getPercentage(item.value)})
                  </span>
                )}
              </>
            )}
          </div>
        ))}
        
        {/* Show total if all values are numbers */}
        {allNumbers && total !== null && payload.length > 1 && (
          <div className="mt-1 pt-1 border-t border-border flex items-center justify-between text-xs">
            <span className="font-medium">Total:</span>
            <span className="font-medium">
              {valuePrefix}{total.toLocaleString()}{valueSuffix}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

import { RechartsWrapper } from "./recharts-wrapper"

export const ChartTooltip = ({ content, ...props }: { content: React.ReactNode; [key: string]: unknown }) => {
  return <RechartsWrapper component="div" {...props}>{content}</RechartsWrapper>
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
  return <RechartsWrapper component="div" {...props}>{content}</RechartsWrapper>
}
