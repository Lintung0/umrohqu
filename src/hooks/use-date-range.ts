import { create } from "zustand";
import { type DateRange } from "react-day-picker";
import { subDays } from "date-fns";

interface DateRangeState {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  month: Date | undefined;
  setMonth: (month: Date | undefined) => void;
}

export const useDateRangeStore = create<DateRangeState>((set) => {
  const today = new Date();
  const sevenDaysAgo = subDays(today, 6);
  return {
    date: {
      from: sevenDaysAgo,
      to: today,
    },
    month: sevenDaysAgo,
    setDate: (date) => set({ date }),
    setMonth: (month) => set({ month }),
  };
});
