import PrayerTimeWidget from "./prayer-time-widget"
import DailyDoa from "./daily-doa"
import CountdownWidget from "./countdown-widget"
import { IslamicDivider } from "@/components/ui/islamic-pattern"
import { CalendarDays } from "lucide-react"

export function IslamicWidgets() {
  return (
    <section className="py-16 px-6 md:px-12 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Fitur Islami</p>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Jadwal Ibadah Harian
          </h2>
          <p className="text-gray-500 mt-2 text-sm max-w-lg">
            Waktu sholat, doa harian, dan hitung mundur hari besar Islam — tersedia langsung di sini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <PrayerTimeWidget />
          <DailyDoa />
          <CountdownWidget />
        </div>

        <div className="mt-10">
          <IslamicDivider />
        </div>
      </div>
    </section>
  )
}
