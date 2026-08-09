"use client"

import { useEffect, useState } from "react"
import { Clock, MapPin } from "lucide-react"

interface PrayerTime {
  name: string
  time: string
  icon: string
}

function getPrayerTimes(latitude: number, longitude: number): PrayerTime[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  const declination = 23.45 * Math.sin((2 * Math.PI / 365) * ((284 + (month * 30 + day)) - 365))
  const latRad = (latitude * Math.PI) / 180
  const declRad = (declination * Math.PI) / 180

  const midDay = 12 + (-longitude / 15)
  const timeDiff = (12 / Math.PI) * Math.acos(
    (-Math.tan(latRad) * Math.tan(declRad))
  )

  const fajrOffset = 1.5
  const dhuhrOffset = 0
  const asrFactor = month >= 4 && month <= 9 ? 1 : 1.5
  const maghribOffset = 0.02
  const ishaOffset = 1.75

  const fajr = midDay - timeDiff - fajrOffset
  const sunrise = midDay - timeDiff + 0.12
  const dhuhr = midDay + dhuhrOffset
  const asr = midDay + timeDiff * asrFactor
  const maghrib = midDay + timeDiff + maghribOffset
  const isha = midDay + timeDiff + ishaOffset

  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })
  }

  return [
    { name: "Subuh", time: formatTime(fajr), icon: "🌅" },
    { name: "Dzuhur", time: formatTime(dhuhr), icon: "☀️" },
    { name: "Ashar", time: formatTime(asr), icon: "🌤️" },
    { name: "Maghrib", time: formatTime(maghrib), icon: "🌇" },
    { name: "Isya", time: formatTime(isha), icon: "🌙" },
  ]
}

function getCurrentPrayer(prayers: PrayerTime[]): string {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  for (let i = prayers.length - 1; i >= 0; i--) {
    const [h, m] = prayers[i].time.split(":").map(Number)
    const prayerMinutes = h * 60 + m
    if (currentMinutes >= prayerMinutes) {
      return prayers[i].name
    }
  }
  return "Subuh"
}

export default function PrayerTimeWidget() {
  const [prayers, setPrayers] = useState<PrayerTime[]>([])
  const [city, setCity] = useState("Mencari lokasi...")
  const [currentPrayer, setCurrentPrayer] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getPrayers = async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false,
          })
        })

        const { latitude, longitude } = pos.coords
        const times = getPrayerTimes(latitude, longitude)
        setPrayers(times)
        setCurrentPrayer(getCurrentPrayer(times))

        try {
          const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
          if (!apiKey) {
            setCity("Jakarta")
          } else {
            const res = await fetch(
              `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${apiKey}&format=json&lang=id`
            )
            if (!res.ok) {
              // Fallback for 401/403/500 — use default city
              setCity("Jakarta")
            } else {
              const data = await res.json()
              setCity(data.features?.[0]?.properties?.city || data.features?.[0]?.properties?.state || "Indonesia")
            }
          }
        } catch {
          setCity("Jakarta")
        }
      } catch {
        const defaultTimes = getPrayerTimes(-6.2088, 106.8456)
        setPrayers(defaultTimes)
        setCurrentPrayer(getCurrentPrayer(defaultTimes))
        setCity("Jakarta")
      } finally {
        setLoading(false)
      }
    }

    getPrayers()
    const interval = setInterval(() => {
      if (prayers.length > 0) {
        setCurrentPrayer(getCurrentPrayer(prayers))
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [prayers.length])

  if (loading) {
    return (
      <div className="glass-strong border border-white/10 rounded-2xl p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 bg-white/10 rounded" />
          <div className="h-4 w-24 bg-white/10 rounded" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-16 bg-white/10 rounded" />
              <div className="h-3 w-12 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-strong border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-gold to-gold-light">
          <Clock className="w-3.5 h-3.5 text-emerald-deep" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-foreground/80">Jadwal Sholat</h3>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="w-2.5 h-2.5" />
            {city}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {prayers.map((prayer) => (
          <div
            key={prayer.name}
            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
              currentPrayer === prayer.name
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm">{prayer.icon}</span>
              {prayer.name}
            </span>
            <span className="font-mono text-[11px]">{prayer.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
