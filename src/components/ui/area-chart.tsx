"use client";

import React from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  date: string;
  value: number;
}

interface StatAreaChartProps {
  data: DataPoint[];
  className?: string;
  color?: string;
  height?: number | string;
  gradientFrom?: string;
  gradientTo?: string;
  showTooltip?: boolean;
  valuePrefix?: string;
}

export function StatAreaChart({
  data,
  className,
  color = "#10b981", // Default emerald color
  height = 60,
  gradientFrom,
  gradientTo,
  showTooltip = true,
  valuePrefix = "DH",
}: StatAreaChartProps) {
  // Generate a unique ID for the gradient
  const gradientId = React.useId();
  
  // Use provided gradient colors or derive from main color
  const actualGradientFrom = gradientFrom || `${color}40`; // 25% opacity
  const actualGradientTo = gradientTo || `${color}00`; // 0% opacity

  // Custom tooltip formatter
  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      name?: string;
      dataKey: string;
      payload?: {
        date: string;
        value: number;
      };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      // Format the date
      const date = payload[0].payload?.date || label || '';
      const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }) : '';
      
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="text-xs font-medium">{formattedDate}</p>
          <p className="text-xs font-medium text-foreground">
            {valuePrefix} {payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("w-full overflow-hidden", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={actualGradientFrom} stopOpacity={0.8} />
              <stop offset="95%" stopColor={actualGradientTo} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          {showTooltip && (
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            isAnimationActive={true}
            activeDot={{ r: 4, strokeWidth: 0, fill: color }}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
