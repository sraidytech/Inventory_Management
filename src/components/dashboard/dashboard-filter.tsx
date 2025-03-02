"use client";

import { useState, useEffect } from "react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface DashboardFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

export function DashboardFilter({
  startDate,
  endDate,
  onDateChange,
  onRefresh,
  isLoading = false,
}: DashboardFilterProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  const [refreshing, setRefreshing] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
  }, [startDate, endDate]);

  const handleApplyFilter = (newStartDate?: string, newEndDate?: string) => {
    // Use the dates passed directly from the DateRangePicker if available
    const currentStartDate = newStartDate || localStartDate;
    const currentEndDate = newEndDate || localEndDate;
    
    console.log("Dashboard filter applying dates:", currentStartDate, currentEndDate);
    
    // Update local state
    setLocalStartDate(currentStartDate);
    setLocalEndDate(currentEndDate);
    
    // Force a refresh with the new dates - this will update the parent component
    onDateChange(currentStartDate, currentEndDate);
    
    // Trigger a refresh immediately after changing dates with the new dates
    handleRefresh(currentStartDate, currentEndDate);
  };

  const handleClearFilter = () => {
    // Reset to last 7 days
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // -6 to include today (total of 7 days)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
    setLocalStartDate(sevenDaysAgoStr);
    setLocalEndDate(today);
    onDateChange(sevenDaysAgoStr, today);
    
    // Trigger a refresh immediately after clearing dates with the 7-day range
    handleRefresh(sevenDaysAgoStr, today);
  };

  const handleRefresh = async (refreshStartDate?: string, refreshEndDate?: string) => {
    setRefreshing(true);
    try {
      // Use the current local state if no dates are provided
      const currentStartDate = refreshStartDate || localStartDate;
      const currentEndDate = refreshEndDate || localEndDate;
      
      // Update parent component with the current dates
      onDateChange(currentStartDate, currentEndDate);
      
      await onRefresh();
      console.log("Dashboard refreshed with date range:", currentStartDate, currentEndDate);
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleRefresh()}
          disabled={isLoading || refreshing}
          className="ml-2"
        >
          <RefreshCw className={`h-4 w-4 ${(isLoading || refreshing) ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>
      
      <DateRangePicker
        startDate={localStartDate}
        endDate={localEndDate}
        onStartDateChange={setLocalStartDate}
        onEndDateChange={setLocalEndDate}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
      />
    </div>
  );
}
