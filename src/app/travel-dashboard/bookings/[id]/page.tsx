"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatRupiah } from "@/lib/utils"
import { enrichPackagesWithCovers } from "@/lib/package-covers"
import {
  ArrowLeft, User, CreditCard, MapPin, Plane, Hotel, Calendar,
  CheckCircle, Clock, XCircle, Loader2, Phone, Mail, FileText,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { Booking, Package } from "@/lib/types"
import { useTranslation } from "@/lib/i18n"

interface Participant {
  full_name: string
  national_id: string
  passport_number: string
  gender: string
  phone: string
}

interface BookingDetail extends Booking {
  packages?: Package
  users?: { full_name: string; email: string; phone: string }
  booking_participants?: Participant[]
}

export default function TravelBookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const id = params.id as string
  const supabase = createClient()

  const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending: { label: t("booking.status_pending"), color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: <Clock className="w-4 h-4" /> },
    confirmed: { label: t("booking.status_confirmed"), color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: <CheckCircle className="w-4 h-4" /> },
    processing: { label: t("booking.status_processing"), color: "text-purple-600", bg: "bg-purple-50 border-purple-200", icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    completed: { label: t("booking.status_completed"), color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle className="w-4 h-4" /> },
    cancelled: { label: t("booking.status_cancelled"), color: "text-red-600", bg: "bg-red-50 border-red-200", icon: <XCircle className="w-4 h-4" /> },
    refunded: { label: t("booking.status_cancelled"), color: "text-gray-600", bg: "bg-gray-50 border-gray-200", icon: <XCircle className="w-4 h-4" /> },
  }

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchBooking = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          packages(name, slug, duration_nights, price, departure_city),
          users(full_name, email, phone),
          booking_participants(*)
        `)
        .eq("id", id)
        .single()

      if (!error && data) {
        const enriched = await enrichPackagesWithCovers(supabase, data.packages ? [data.packages] : [])
        setBooking({ ...(data as BookingDetail), packages: (enriched?.[0] as Package) || (data as any).packages })
      }
      setLoading(false)
    }
    fetchBooking()
  }, [id])

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    const updateData: Record<string, any> = { status: newStatus }
    if (newStatus === "confirmed" || newStatus === "cancelled") {
      const action = newStatus === "confirmed" ? "confirm" : "cancel"
      const res = await fetch("/api/booking/travel-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || t("travel_dashboard.status_update_failed"))
      } else {
        setBooking((prev) => prev ? { ...prev, ...updateData } : prev)
        toast.success(t("travel_dashboard.status_updated"))
      }
      setUpdating(false)
      return
    }

    const { error } = await supabase.from("bookings").update(updateData).eq("id", id)
    if (error) {
      toast.error(t("travel_dashboard.status_update_failed"))
    } else {
      setBooking((prev) => prev ? { ...prev, ...updateData } : prev)
      toast.success(t("travel_dashboard.status_updated"))
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">{t("booking.not_found")}</p>
        <Link href="/travel-dashboard/bookings" className="text-sm text-primary font-semibold">
          {t("booking.back_to_list")}
        </Link>
      </div>
    )
  }

  const status = STATUS_MAP[booking.status || "pending"] || STATUS_MAP.pending

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link
          href="/travel-dashboard/bookings"
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("travel_dashboard.booking_detail")}</h1>
          <p className="text-sm text-muted-foreground">#{booking.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Status + Actions */}
      <div className="bg-white rounded-2xl border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${status.bg} ${status.color}`}>
            {status.icon}
            {status.label}
          </div>
          <span className="text-sm text-muted-foreground">
            {t("travel_dashboard.channel")}: {booking.booking_channel === "marketplace" ? "Portal" : booking.booking_channel === "tenant_subdomain" ? "Subdomain" : "Custom Domain"}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {booking.status === "processing" && (
            <>
              <button
                onClick={() => updateStatus("confirmed")}
                disabled={updating}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {STATUS_MAP.confirmed?.label}
              </button>
              <button
                onClick={() => updateStatus("cancelled")}
                disabled={updating}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {STATUS_MAP.cancelled?.label}
              </button>
            </>
          )}
          {booking.status === "confirmed" && (
            <button
              onClick={() => updateStatus("completed")}
              disabled={updating}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {STATUS_MAP.completed?.label}
            </button>
          )}
          {booking.status === "pending_payment" && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200">
              Menunggu Pembayaran
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Package info */}
          {booking.packages && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-semibold mb-4">{t("travel_dashboard.package")}</h2>
              <div className="flex gap-4">
                {booking.packages.image_url && (
                  <img
                    src={booking.packages.image_url}
                    alt={booking.packages.name}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">{booking.packages.name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {booking.packages.duration_nights} {t("package.day")}</span>
                    {booking.packages.airline && <span className="flex items-center gap-1"><Plane className="w-3.5 h-3.5" /> {booking.packages.airline}</span>}
                  </div>
                  {booking.packages.hotel_makkah && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Hotel className="w-3.5 h-3.5" /> {booking.packages.hotel_makkah}
                    </p>
                  )}
                  <p className="font-bold text-primary">{formatRupiah(booking.packages.price)} / {t("booking.participants")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-semibold mb-4">
              {t("booking.participants")} ({booking.booking_participants?.length || 0})
            </h2>
            {booking.booking_participants && booking.booking_participants.length > 0 ? (
              <div className="space-y-3">
                {booking.booking_participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">{t("auth.full_name")}</p>
                        <p className="font-medium">{p.full_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">NIK</p>
                        <p className="font-medium font-mono text-xs">{p.national_id || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Paspor</p>
                        <p className="font-medium font-mono text-xs">{p.passport_number || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Gender</p>
                        <p className="font-medium capitalize">{p.gender || "-"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("booking.no_bookings")}</p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-semibold mb-4">{t("travel_dashboard.customer")}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-primary" />
                <span>{booking.users?.full_name || "-"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{booking.users?.email || "-"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{booking.users?.phone || "-"}</span>
              </div>
            </div>
          </div>

          {/* Payment summary */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-semibold mb-4">{t("booking.payment_info")}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("booking.package")} ({booking.pilgrim_count})</span>
                <span>{formatRupiah(booking.price)}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base">
                <span>{t("booking.total")}</span>
                <span className="text-primary">{formatRupiah(booking.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
