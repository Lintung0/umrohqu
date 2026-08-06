import PrayerTimeWidget from "./prayer-time-widget"
import DailyDoa from "./daily-doa"
import CountdownWidget from "./countdown-widget"
import { IslamicDivider } from "@/components/ui/islamic-pattern"

export function IslamicWidgets() {
  return (
    <section className="py-16 px-6 md:px-12 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold-dark text-xs font-semibold">
            <span aria-hidden="true">🕌</span> Fitur Islami
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Teman Ibadah <span className="text-gradient-gold">Harian Anda</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            Jadwal sholat, doa harian, dan pengingat event islami — semua dalam satu tempat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PrayerTimeWidget />
          <DailyDoa />
          <CountdownWidget />
        </div>

        <div className="mt-12">
          <IslamicDivider />
        </div>
      </div>
    </section>
  )
}
