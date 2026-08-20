"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { BookOpen, ChevronRight } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { BOOKING_STATUSES, formatRupiah, getStatusColor, getStatusLabel } from "@/lib/constants"

interface BookingRow {
  id: string
  status: string
  pilgrim_count: number
  price: number
  fee: number
  total: number
  booking_channel: string
  created_at: string
  package: { name: string; slug: string; image_url: string | null } | null
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
          .select("id, status, pilgrim_count, price, fee, total, booking_channel, created_at, package:packages(name, slug)")
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("booking.title")}</h1>
        <p className="text-muted-foreground mt-1">Lacak semua pemesanan paket umroh Anda</p>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
        {BOOKING_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === s.value
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center shadow-sm">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">{t("booking.no_bookings")}</p>
          <Link href="/search" className="text-sm text-emerald-600 hover:text-emerald-700 mt-2 inline-flex items-center gap-1">
            {t("package.search_title")} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl shadow-sm divide-y divide-border">
          {filtered.map((booking) => (
            <Link
              key={booking.id}
              href={`/dashboard/bookings/${booking.id}`}
              className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              {booking.package?.image_url ? (
                <Image
                  src={booking.package.image_url}
                  alt={booking.package.name}
                  width={56}
                  height={56}
                  className="rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-muted-foreground/50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">{booking.package?.name || t("booking.package")}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(booking.status, "booking")}`}>
                    {getStatusLabel(booking.status, "booking")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {booking.pilgrim_count} {t("booking.participants")} · {new Date(booking.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">{formatRupiah(booking.total)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
