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

  const handleApplyFilter = () => {
    console.log("Dashboard filter applying dates:", localStartDate, localEndDate);
    
    // Force a refresh with the new dates - this will update the parent component
    onDateChange(localStartDate, localEndDate);
    
    // Wait a moment to ensure state is updated before refreshing
    setTimeout(() => {
      // Trigger a refresh immediately after changing dates
      handleRefresh();
    }, 100);
  };

  const handleClearFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setLocalStartDate(today);
    setLocalEndDate(today);
    onDateChange(today, today);
    // Trigger a refresh immediately after clearing dates
    handleRefresh();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      console.log("Dashboard refreshed");
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
          onClick={handleRefresh}
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
