"use client";

import { TooltipProps } from "recharts";
import { cn } from "@/lib/utils";

// Custom tooltip component for better styling
export const CustomTooltip = ({ 
  active, 
  payload, 
  label, 
  valuePrefix = "", 
  valueSuffix = "",
  indicator = "dot",
  hideLabel = false,
  labelFormatter,
  formatter,
  className,
}: TooltipProps<number, string> & { 
  valuePrefix?: string;
  valueSuffix?: string;
  indicator?: "dot" | "line" | "dashed";
  hideLabel?: boolean;
  labelFormatter?: (value: string) => React.ReactNode;
  formatter?: (value: number, name: string, item: unknown, index: number) => React.ReactNode;
  className?: string;
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
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
    <div className={cn("bg-background border rounded-lg shadow-lg p-3 text-sm", className)}>
      {!hideLabel && (
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          {labelFormatter ? labelFormatter(label as string) : label}
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        {payload.map((item, index) => (
          <div key={`tooltip-${index}`} className="flex items-center gap-1.5 text-xs">
            {formatter ? (
              formatter(Number(item.value), item.name || '', item, index)
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
  );
};
