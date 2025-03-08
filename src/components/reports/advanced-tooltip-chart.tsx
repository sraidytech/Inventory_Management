"use client"

import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig } from "@/components/ui/chart"
import { CustomTooltip } from "./shared-chart-components"
import { TranslatedText } from "@/components/language/translated-text"

interface AdvancedTooltipChartProps {
  title: React.ReactNode
  description?: React.ReactNode
  data: Array<{
    date: string
    [key: string]: string | number
  }>
  config: ChartConfig
  className?: string
}

export function AdvancedTooltipChart({
  title,
  description,
  data,
  config,
  className,
}: AdvancedTooltipChartProps) {
  const dataKeys = Object.keys(config).filter(key => key !== 'label')
  
  // Get colors from config
  const getColorForKey = (key: string): string => {
    return config[key]?.color || `hsl(var(--chart-${Object.keys(config).indexOf(key) + 1}))`
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description || "Tooltip with custom formatter and total."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => {
                  if (typeof value === 'string' && value.includes('-')) {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      weekday: "short",
                    });
                  }
                  return value;
                }}
              />
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={config[key]?.label || key}
                  stackId="a"
                  fill={getColorForKey(key)}
                  radius={index === 0 ? [0, 0, 4, 4] : [4, 4, 0, 0]}
                />
              ))}
              <Tooltip 
                cursor={false}
                content={
                  <CustomTooltip 
                    active={false} // This will be overridden by Recharts
                    payload={[]} // This will be overridden by Recharts
                    hideLabel={false}
                    formatter={(value, name) => (
                      <>
                        <span className="text-foreground font-medium">
                          {typeof name === 'string' && name.includes('.') ? (
                            <TranslatedText 
                              namespace={name.split('.')[0]} 
                              id={name.split('.')[1]} 
                            />
                          ) : (
                            name
                          )}
                        </span>
                        <span className="ml-auto font-mono font-medium">
                          {typeof value === 'number' ? value.toLocaleString() : value}
                          <span className="text-muted-foreground ml-1 font-normal">
                            <TranslatedText namespace="reports" id="units" />
                          </span>
                        </span>
                      </>
                    )}
                  />
                }
              />
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
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
