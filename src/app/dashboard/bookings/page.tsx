"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { BookOpen, Filter } from "lucide-react"
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
          .select("id, status, pilgrim_count, price, fee, total, booking_channel, created_at, package:packages(name, slug, image_url)")
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
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Booking Saya</h1>
        <p className="text-muted-foreground mt-1">Kelola semua pemesanan umroh Anda</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        {BOOKING_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === s.value
                ? "bg-emerald-600 text-white"
                : "bg-white border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Tidak ada booking ditemukan</p>
          <Link href="/search" className="text-sm text-primary hover:underline mt-2 inline-block">Cari Paket</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <Link
              key={booking.id}
              href={`/dashboard/bookings/${booking.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-border p-4 hover:shadow-md transition-shadow"
            >
              {booking.package?.image_url ? (
                <Image
                  src={booking.package.image_url}
                  alt={booking.package.name}
                  width={80}
                  height={80}
                  className="rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{booking.package?.name || "Paket Umroh"}</p>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status, "booking")}`}>
                    {getStatusLabel(booking.status, "booking")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {booking.pilgrim_count} jamaah · {booking.booking_channel === "marketplace" ? "Portal Utama" : "Website Travel"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(booking.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold">{formatRupiah(booking.total)}</p>
                <p className="text-xs text-muted-foreground">+ {formatRupiah(booking.fee)} fee</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
