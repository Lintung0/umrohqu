"use client"

import { useEffect, useState } from "react"
import { Calendar } from "lucide-react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface IslamicEvent {
  name: string
  date: Date
  icon: string
  description: string
}

function getUpcomingEvents(): IslamicEvent[] {
  const now = new Date()
  const year = now.getFullYear()

  const events: IslamicEvent[] = []

  const ramadanStart = new Date(year, 2, 1)
  if (now > ramadanStart) {
    ramadanStart.setFullYear(year + 1)
  }
  events.push({
    name: "Ramadan",
    date: ramadanStart,
    icon: "🌙",
    description: "Bulan suci penuh berkah",
  })

  const idulFitri = new Date(year, 3, 1)
  if (now > idulFitri) {
    idulFitri.setFullYear(year + 1)
  }
  events.push({
    name: "Idul Fitri",
    date: idulFitri,
    icon: "🎉",
    description: "Hari kemenangan",
  })

  const hajjSeason = new Date(year, 5, 10)
  if (now > hajjSeason) {
    hajjSeason.setFullYear(year + 1)
  }
  events.push({
    name: "Idul Adha",
    date: hajjSeason,
    icon: "🐑",
    description: "Hari Raya Haji",
  })

  const muharram = new Date(year, 6, 1)
  if (now > muharram) {
    muharram.setFullYear(year + 1)
  }
  events.push({
    name: "Tahun Baru Hijriah",
    date: muharram,
    icon: "📅",
    description: "1 Muharram",
  })

  return events
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export default function CountdownWidget() {
  const [events, setEvents] = useState<IslamicEvent[]>([])
  const [selected, setSelected] = useState<IslamicEvent | null>(null)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const upcoming = getUpcomingEvents()
    setEvents(upcoming)
    if (upcoming.length > 0) {
      setSelected(upcoming[0])
    }
  }, [])

  useEffect(() => {
    if (!selected) return

    setTimeLeft(getTimeLeft(selected.date))

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(selected.date))
    }, 1000)

    return () => clearInterval(interval)
  }, [selected])

  if (!selected) return null

  return (
    <div className="glass-strong border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-gold to-gold-light">
          <Calendar className="w-3.5 h-3.5 text-emerald-deep" />
        </div>
        <h3 className="text-xs font-semibold text-foreground/80">Hitung Mundur</h3>
      </div>

      {/* Event selector */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {events.map((event) => (
          <button
            key={event.name}
            onClick={() => setSelected(event)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${
              selected.name === event.name
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            <span>{event.icon}</span>
            {event.name}
          </button>
        ))}
      </div>

      {/* Countdown display */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { value: timeLeft.days, label: "Hari" },
          { value: timeLeft.hours, label: "Jam" },
          { value: timeLeft.minutes, label: "Menit" },
          { value: timeLeft.seconds, label: "Detik" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5"
          >
            <span className="text-lg font-bold text-foreground/90 font-mono">
              {String(item.value).padStart(2, "0")}
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        {selected.description} — {selected.date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  )
}
