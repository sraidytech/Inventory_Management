"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface SparklinePoint {
  value: number;
  date: string;
}

interface EnhancedStatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  sparklineData?: SparklinePoint[];
  className?: string;
}

export function EnhancedStatCard({
  title,
  value,
  icon,
  trend,
  sparklineData,
  className,
}: EnhancedStatCardProps) {

  // Determine trend icon and color
  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value > 0) {
      return (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">+{trend.value}%</span>
          {trend.label && <span className="text-xs ml-1 text-muted-foreground">{trend.label}</span>}
        </div>
      );
    } else if (trend.value < 0) {
      return (
        <div className="flex items-center text-red-600 dark:text-red-400">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">{trend.value}%</span>
          {trend.label && <span className="text-xs ml-1 text-muted-foreground">{trend.label}</span>}
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Minus className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">0%</span>
          {trend.label && <span className="text-xs ml-1 text-muted-foreground">{trend.label}</span>}
        </div>
      );
    }
  };

  // Generate sparkline chart using Recharts
  const generateSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    
    // Use consistent colors based on title
    let chartColor = "#10B981"; // Default green
    
    if (title.includes("Suppliers") || title.includes("Purchases")) {
      chartColor = "#6366F1"; // Indigo/blue for suppliers and purchases
    } else if (title.includes("Sales")) {
      chartColor = "#10B981"; // Green for sales
    } else if (title.includes("Products")) {
      chartColor = "#3B82F6"; // Blue for products
    } else if (title.includes("Profit")) {
      chartColor = "#10B981"; // Green for profit
    }
    
    return (
      <div className="mt-4 h-14">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorValue-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area 
              type="natural" 
              dataKey="value" 
              stroke={chartColor} 
              strokeWidth={1.5}
              fillOpacity={1}
              fill={`url(#colorValue-${title.replace(/\s+/g, '')})`}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card className={cn(
      "shadow-sm transition-all hover:shadow-md",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {getTrendIcon()}
          </div>
          {icon && (
            <div>
              {icon}
            </div>
          )}
        </div>
        {generateSparkline()}
      </CardContent>
    </Card>
  );
}
