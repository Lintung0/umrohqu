"use client"

import { useState, useEffect, useCallback } from "react"
import { Clock, MapPin, Loader2, Landmark, Sun, Moon, Sunrise, Sunset } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface PrayerTime {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
  Date: string
}

interface PrayerInfo {
  name: string
  time: string
  icon: React.ElementType
  color: string
}

const CITY_SUGGESTIONS = [
  "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang",
  "Makassar", "Palembang", "Tangerang", "Depok", "Yogyakarta",
  "Malang", "Solo", "Bogor", "Batam", "Padang",
  "Denpasar", "Manado", "Samarinda", "Balikpapan", "Banjarmasin",
  "Makkah", "Madinah", "Jerusalem",
]

export default function JadwalSholatPage() {
  const [city, setCity] = useState("Jakarta")
  const [inputCity, setInputCity] = useState("Jakarta")
  const [times, setTimes] = useState<PrayerTime | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState("")
  const [nextPrayer, setNextPrayer] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const fetchTimes = useCallback(async (cityName: string) => {
    setLoading(true)
    try {
      const res = await fetch(
        `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(cityName)}&country=Indonesia&method=2`
      )
      const data = await res.json()
      if (data.code === 200) {
        setTimes(data.data.timings)
        setCity(cityName)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTimes(city)
  }, [])

  useEffect(() => {
    if (!times) return

    const updateCountdown = () => {
      const now = new Date()
      const prayers: PrayerInfo[] = [
        { name: "Subuh", time: times.Fajr, icon: Sunrise, color: "text-indigo-500" },
        { name: "Terbit", time: times.Sunrise, icon: Sun, color: "text-amber-500" },
        { name: "Dzuhur", time: times.Dhuhr, icon: Sun, color: "text-yellow-500" },
        { name: "Ashar", time: times.Asr, icon: Sun, color: "text-orange-500" },
        { name: "Maghrib", time: times.Maghrib, icon: Sunset, color: "text-red-500" },
        { name: "Isya", time: times.Isha, icon: Moon, color: "text-blue-500" },
      ]

      const todayStr = now.toISOString().split("T")[0]

      for (const prayer of prayers) {
        if (prayer.name === "Terbit") continue
        const [h, m] = prayer.time.split(":").map(Number)
        const prayerDate = new Date(`${todayStr}T${prayer.time}:00`)
        if (prayerDate > now) {
          const diff = prayerDate.getTime() - now.getTime()
          const hours = Math.floor(diff / 3600000)
          const mins = Math.floor((diff % 3600000) / 60000)
          const secs = Math.floor((diff % 60000) / 1000)
          setCountdown(`${hours}j ${mins}m ${secs}s`)
          setNextPrayer(prayer.name)
          return
        }
      }
      setCountdown(" Sudah lewat semua hari ini")
      setNextPrayer("")
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [times])

  const handleSearch = () => {
    if (inputCity.trim()) {
      fetchTimes(inputCity.trim())
      setShowSuggestions(false)
    }
  }

  const filteredSuggestions = CITY_SUGGESTIONS.filter(
    (c) => c.toLowerCase().includes(inputCity.toLowerCase()) && c !== inputCity
  ).slice(0, 6)

  const prayerSchedule: PrayerInfo[] = times ? [
    { name: "Subuh", time: times.Fajr, icon: Sunrise, color: "text-indigo-500" },
    { name: "Dzuhur", time: times.Dhuhr, icon: Sun, color: "text-yellow-500" },
    { name: "Ashar", time: times.Asr, icon: Sun, color: "text-orange-500" },
    { name: "Maghrib", time: times.Maghrib, icon: Sunset, color: "text-red-500" },
    { name: "Isya", time: times.Isha, icon: Moon, color: "text-blue-500" },
  ] : []

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <Landmark className="w-3.5 h-3.5" />
            Jadwal Sholat
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Jadwal Sholat</h1>
          <p className="text-muted-foreground text-sm">Jadwal sholat harian berdasarkan lokasi Anda</p>
        </div>

        {/* City Search */}
        <div className="relative max-w-md mx-auto mb-6">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Masukkan nama kota..."
            value={inputCity}
            onChange={(e) => {
              setInputCity(e.target.value)
              setShowSuggestions(true)
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400/20"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-white border border-blue-100 rounded-xl shadow-lg z-10 overflow-hidden">
              {filteredSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInputCity(s)
                    fetchTimes(s)
                    setShowSuggestions(false)
                  }}
                  className="w-full px-4 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Memuat jadwal sholat...</p>
          </div>
        ) : times ? (
          <>
            {/* Countdown Card */}
            <Card className="p-6 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
              <div className="text-center">
                <p className="text-blue-200 text-sm mb-1">Sholat Berikutnya</p>
                <p className="text-3xl font-bold mb-1">{nextPrayer || "-"}</p>
                <p className="text-2xl font-mono text-blue-100">{countdown}</p>
                <p className="text-xs text-blue-300 mt-2">{city} • {times.Date}</p>
              </div>
            </Card>

            {/* Prayer Times Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {prayerSchedule.map((prayer) => (
                <div
                  key={prayer.name}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    nextPrayer === prayer.name
                      ? "bg-blue-50 border-blue-300 shadow-md"
                      : "bg-white border-gray-100"
                  }`}
                >
                  {prayer.name === "Subuh" && <Sunrise className={`w-6 h-6 mx-auto mb-2 ${prayer.color}`} />}
                  {prayer.name === "Dzuhur" && <Sun className={`w-6 h-6 mx-auto mb-2 ${prayer.color}`} />}
                  {prayer.name === "Ashar" && <Sun className={`w-6 h-6 mx-auto mb-2 ${prayer.color}`} />}
                  {prayer.name === "Maghrib" && <Sunset className={`w-6 h-6 mx-auto mb-2 ${prayer.color}`} />}
                  {prayer.name === "Isya" && <Moon className={`w-6 h-6 mx-auto mb-2 ${prayer.color}`} />}
                  <p className="text-sm font-semibold text-gray-800">{prayer.name}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{prayer.time}</p>
                </div>
              ))}
            </div>

            {/* Sunrise */}
            <Card className="mt-3 p-4">
              <div className="flex items-center justify-center gap-3">
                <Sunrise className="w-5 h-5 text-amber-500" />
                <span className="text-sm text-muted-foreground">Terbit Matahari</span>
                <span className="text-sm font-bold">{times.Sunrise}</span>
              </div>
            </Card>
          </>
        ) : (
          <div className="text-center py-16">
            <Landmark className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Kota tidak ditemukan. Coba kota lain.</p>
          </div>
        )}
      </div>
    </main>
  )
}
