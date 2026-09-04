"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { BookOpen, ChevronRight, CalendarCheck2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { BOOKING_STATUSES, formatRupiah, getStatusColor, getStatusLabel } from "@/lib/constants"

interface BookingRow {
  id: string
  status: string
  pilgrim_count: number
  price: number
  total: number
  booking_channel: string
  created_at: string
  package: { name: string; slug: string } | null
}

export default function BookingsPage() {
  const { t } = useTranslation()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [filter, setFilter] = useState("semua")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from("bookings")
          .select("id, status, pilgrim_count, price, total, booking_channel, created_at, package:packages(name, slug)")
          .eq("customer_id", user.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
        setBookings((data as any) || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === "semua" ? bookings : bookings.filter((b) => b.status === filter)

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 bg-muted rounded-lg animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 text-white p-6 sm:p-8">
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="bk-islamic" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
              <polygon points="22,2 26,17 41,17 29,27 33,42 22,32 11,42 15,27 3,17 18,17" fill="none" stroke="#d4a017" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bk-islamic)" />
        </svg>
        <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" aria-hidden />
        <div className="relative flex items-center gap-4">
          <span className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <CalendarCheck2 className="w-7 h-7 text-amber-300" />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-100/80 mb-1">Pemesanan Anda</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow-lg">{t("booking.title")}</h1>
            <p className="text-emerald-100/80 mt-1 text-sm sm:text-base">Lacak semua pemesanan paket umroh Anda</p>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
        {BOOKING_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === s.value
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-600/25"
                : "bg-white border border-slate-200 text-muted-foreground hover:text-emerald-700 hover:border-emerald-300 hover:shadow-sm"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="font-medium text-muted-foreground">{t("booking.no_bookings")}</p>
          <Link href="/search" className="mt-3 px-5 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all hover:-translate-y-0.5 inline-flex items-center gap-1">
            {t("package.search_title")} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <Link
              key={booking.id}
              href={`/dashboard/bookings/${booking.id}`}
              className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-100/50 hover:border-emerald-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 shrink-0 flex items-center justify-center group-hover:from-emerald-500 group-hover:to-emerald-700 transition-colors">
                <BookOpen className="w-5 h-5 text-emerald-600 group-hover:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm group-hover:text-emerald-700 transition-colors">{booking.package?.name || t("booking.package")}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-medium ${getStatusColor(booking.status, "booking")}`}>
                    {getStatusLabel(booking.status, "booking")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {booking.pilgrim_count} {t("booking.participants")} · {new Date(booking.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-800">{formatRupiah(booking.total)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-emerald-600 transition-all group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
