"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { BookOpen, ChevronRight, ChevronLeft, CalendarCheck2, ClipboardList, Package, CalendarRange } from "lucide-react"
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

const PAGE_SIZE = 8

interface BookingGroup {
  key: string
  label: string
  bookings: BookingRow[]
}

export default function BookingsPage() {
  const { t } = useTranslation()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [filter, setFilter] = useState("semua")
  const [page, setPage] = useState(1)
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

  const filtered = useMemo(
    () => (filter === "semua" ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter]
  )

  const groups = useMemo<BookingGroup[]>(() => {
    const map = new Map<string, BookingGroup>()
    for (const booking of filtered) {
      const d = new Date(booking.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
      if (!map.has(key)) map.set(key, { key, label, bookings: [] })
      map.get(key)!.bookings.push(booking)
    }
    return Array.from(map.values())
  }, [filtered])

  const totalBooks = bookings.length
  const activeCount = bookings.filter((b) => b.status === "pending_payment" || b.status === "processing" || b.status === "confirmed").length
  const thisMonthCount = useMemo(() => {
    const now = new Date()
    return bookings.filter((b) => {
      const d = new Date(b.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
  }, [bookings])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, filtered.length)
  const pageSlice = filtered.slice(startIndex, endIndex)

  useEffect(() => {
    setPage(1)
  }, [filter])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
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
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Total Pemesanan</p>
            <p className="text-xl font-bold text-slate-800">{totalBooks}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Aktif</p>
            <p className="text-xl font-bold text-slate-800">{activeCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <CalendarRange className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Bulan Ini</p>
            <p className="text-xl font-bold text-slate-800">{thisMonthCount}</p>
          </div>
        </div>
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
        <>
          <div className="space-y-5">
            {groups.map((group) => {
              const groupPageSlice = group.bookings.filter((b) => pageSlice.includes(b))
              if (groupPageSlice.length === 0) return null
              return (
                <div key={group.key}>
                  {/* Header bulan */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CalendarCheck2 className="w-4 h-4" />
                    </span>
                    <h2 className="font-semibold text-sm text-slate-700">{group.label}</h2>
                    <span className="text-xs text-muted-foreground">· {group.bookings.length} pesanan</span>
                  </div>
                  <div className="bg-white border border-border rounded-xl shadow-sm divide-y divide-border">
                    {groupPageSlice.map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/dashboard/bookings/${booking.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="w-14 h-14 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{booking.package?.name || t("booking.package")}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(booking.status, "booking")}`}>
                              {getStatusLabel(booking.status, "booking")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {booking.pilgrim_count} {t("booking.participants")}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold">{formatRupiah(booking.total)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(booking.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Indikator + Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Menampilkan {filtered.length === 0 ? 0 : startIndex + 1}–{endIndex} dari {filtered.length} pemesanan
            </p>            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-lg border border-border bg-white flex items-center justify-center text-slate-600 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      p === currentPage
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "border border-border bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-600"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 rounded-lg border border-border bg-white flex items-center justify-center text-slate-600 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
