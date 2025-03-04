"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StatAreaChart } from "@/components/ui/area-chart";

interface SparklinePoint {
  value: number;
  date: string;
}

interface EnhancedStatCardProps {
  title: string | ReactNode;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  sparklineData?: SparklinePoint[];
  className?: string;
  chartColor?: string;
  valuePrefix?: string;
}

export function EnhancedStatCard({
  title,
  value,
  icon,
  trend,
  sparklineData,
  className,
  chartColor,
  valuePrefix = "DH",
}: EnhancedStatCardProps) {
  // Determine chart color based on trend
  const getChartColor = () => {
    if (chartColor) return chartColor;
    
    if (trend) {
      if (trend.value > 0) return "#10B981"; // green
      if (trend.value < 0) return "#EF4444"; // red
    }
    
    return "#6366F1"; // indigo (default)
  };

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
        
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4">
            <StatAreaChart 
              data={sparklineData}
              color={getChartColor()}
              height={60}
              valuePrefix={valuePrefix}
              showTooltip={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
