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

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onApply: () => void
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
  
  // Convert string dates to Date objects for the calendar
  const from = startDate ? new Date(startDate) : undefined
  const to = endDate ? new Date(endDate) : undefined
  const [date, setDate] = React.useState<DateRange | undefined>(
    from && to ? { from, to } : undefined
  )
  
  // We'll only update parent component when Apply button is clicked
  
  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return format(date, "MMM dd, yyyy")
  }
  
  const buttonText = startDate && endDate 
    ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}` 
    : "Date Filter"
  
  const hasDateRange = startDate && endDate

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-1",
            hasDateRange && "bg-blue-50 border-blue-200",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 mr-1" />
          {buttonText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={from}
          selected={date}
          onSelect={setDate}
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
            Clear
          </Button>
          <Button 
            onClick={() => {
              if (date?.from) {
                onStartDateChange(format(date.from, "yyyy-MM-dd"))
              }
              if (date?.to) {
                onEndDateChange(format(date.to, "yyyy-MM-dd"))
              }
              onApply()
              setOpen(false)
            }}
            disabled={!date?.from || !date?.to}
            size="sm"
          >
            Apply Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
