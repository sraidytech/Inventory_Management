"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select date",
  className,
}: DatePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "pl-10",
            !value && "text-muted-foreground"
          )}
          placeholder={placeholder}
        />
        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  className?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <DatePicker
        value={startDate}
        onChange={onStartDateChange}
        label="Start Date"
        placeholder="Start date"
      />
      <DatePicker
        value={endDate}
        onChange={onEndDateChange}
        label="End Date"
        placeholder="End date"
      />
    </div>
  )
}
