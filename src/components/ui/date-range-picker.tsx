"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useLanguage } from "@/components/language/language-provider"
import { useTranslations } from "next-intl"

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onApply: (startDate?: string, endDate?: string) => void
  onClear: () => void
  className?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onClear,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const { isRTL } = useLanguage();
  const t = useTranslations("dashboard");
  
  // Convert string dates to Date objects for the calendar
  const from = startDate ? new Date(startDate) : undefined
  const to = endDate ? new Date(endDate) : undefined
  const [date, setDate] = React.useState<DateRange | undefined>(
    from && to ? { from, to } : undefined
  )
  
  // Update local state when date range changes in the calendar
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDate(range);
    console.log("Date range selected in calendar:", range);
  }
  
  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return format(date, "MMM dd, yyyy")
  }
  
  const buttonText = startDate && endDate 
    ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}` 
    : t("filter.dateFilter")
  
  const hasDateRange = startDate && endDate

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-1",
            hasDateRange && "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
            className
          )}
        >
          <CalendarIcon className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
          {buttonText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={from}
          selected={date}
          onSelect={handleDateRangeChange}
          numberOfMonths={2}
          className="rounded-md border"
        />
        <div className="flex items-center justify-between p-3 border-t">
          <Button 
            variant="outline" 
            onClick={() => {
              setDate(undefined)
              onClear()
              setOpen(false)
            }}
            size="sm"
          >
            {t("filter.reset")}
          </Button>
          <Button 
            onClick={() => {
              if (date?.from && date?.to) {
                const formattedFrom = format(date.from, "yyyy-MM-dd");
                const formattedTo = format(date.to, "yyyy-MM-dd");
                
                console.log("Applying date range:", formattedFrom, formattedTo);
                
                // First update the parent component's state with the selected dates
                if (onStartDateChange) onStartDateChange(formattedFrom);
                if (onEndDateChange) onEndDateChange(formattedTo);
                
                // Close the popover
                setOpen(false);
                
  // Call onApply directly with the selected dates to avoid race conditions with state updates
  if (onApply) onApply(formattedFrom, formattedTo);
              }
            }}
            disabled={!date?.from || !date?.to}
            size="sm"
          >
            {t("filter.applyFilter")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
