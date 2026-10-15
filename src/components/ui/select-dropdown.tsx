"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

export interface SelectDropdownProps {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  triggerClassName?: string
  contentClassName?: string
  "aria-label"?: string
}

export function SelectDropdown({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  triggerClassName,
  contentClassName,
  "aria-label": ariaLabel,
}: SelectDropdownProps) {
  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        if (val) onValueChange(val)
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn("w-full justify-between", triggerClassName || className)}
      >
        <SelectValue placeholder={placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
