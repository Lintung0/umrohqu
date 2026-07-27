"use client";

import * as React from "react";
import {
  addDays,
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useDateRangeStore } from "@/hooks/use-date-range";

export function DateRange() {
  const { date, setDate, month, setMonth } = useDateRangeStore();

  const presets = [
    {
      label: "Hari ini",
      getValue: () => {
        const today = new Date();
        return { from: today, to: today };
      },
    },
    {
      label: "7 hari terakhir",
      getValue: () => {
        const today = new Date();
        return { from: subDays(today, 6), to: today };
      },
    },
    {
      label: "Bulan ini",
      getValue: () => {
        const today = new Date();
        return { from: startOfMonth(today), to: endOfMonth(today) };
      },
    },
    {
      label: "Tahun ini",
      getValue: () => {
        const today = new Date();
        return { from: startOfYear(today), to: endOfYear(today) };
      },
    },
  ];

  return (
    <Field className="max-w-60">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              id="date-picker-range"
              className="justify-start px-2.5 font-normal"
            >
              <CalendarIcon data-icon="inline-start" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row sm:divide-x divide-border">
            {/* Quick select options */}
            <div className="flex flex-col gap-1 p-3 w-full sm:w-44 bg-muted/10 shrink-0">
              <span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pilih Cepat
              </span>
              {presets.map((preset) => {
                const presetRange = preset.getValue();
                const isActive =
                  date?.from &&
                  date?.to &&
                  presetRange.from.toDateString() === date.from.toDateString() &&
                  presetRange.to.toDateString() === date.to.toDateString();

                return (
                  <Button
                    key={preset.label}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="justify-start font-normal text-left"
                    onClick={() => {
                      setDate(presetRange);
                      setMonth(presetRange.from);
                    }}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </div>

            {/* Calendar */}
            <div className="p-1">
              <Calendar
                mode="range"
                month={month}
                onMonthChange={setMonth}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  );
}
