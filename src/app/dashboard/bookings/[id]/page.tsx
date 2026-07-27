"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Calendar, MapPin, Plane, Hotel, Users, CreditCard, FileText, CheckCircle, Clock, XCircle } from "lucide-react"
import { formatRupiah, getStatusColor, getStatusLabel } from "@/lib/constants"
import Link from "next/link"

interface BookingDetail {
  id: string
  status: string
  pilgrim_count: number
  price: number
  fee: number
  total: number
  booking_channel: string
  notes: string | null
  created_at: string
  package: { name: string; slug: string; image_url: string | null; departure_city: string | null; duration_days: number | null; airline: string | null; hotel_makkah: string | null; hotel_makkah_stars: number | null; hotel_madinah: string | null; hotel_madinah_stars: number | null } | null
  participants: { id: string; full_name: string; nik: string | null; passport_no: string | null; gender: string | null; phone: string | null; relation: string }[]
}

const TIMELINE_STEPS = [
  { key: "pending_payment", label: "Dibuat", icon: Clock },
  { key: "confirmed", label: "Dikonfirmasi", icon: CheckCircle },
  { key: "completed", label: "Selesai", icon: CheckCircle },
]

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("bookings")
        .select("*, package:packages(name, slug, image_url, departure_city, duration_days, airline, hotel_makkah, hotel_makkah_stars, hotel_madinah, hotel_madinah_stars), participants:booking_participants(id, full_name, nik, passport_no, gender, phone, relation)")
        .eq("id", params.id)
        .single()
      setBooking(data as any)
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-48 bg-muted rounded-2xl animate-pulse" />
          <div className="h-48 bg-muted rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-muted-foreground">Booking tidak ditemukan</p>
          <Link href="/dashboard/bookings" className="text-emerald-600 hover:underline text-sm mt-2 inline-block">
            Kembali ke daftar booking
          </Link>
        </div>
      </div>
    )
  }

  const pkg = booking.package
  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.key === booking.status)

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Kode Booking</p>
            <h1 className="text-xl font-bold font-mono">{booking.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-muted-foreground mt-1">{pkg?.name || "Paket Umroh"}</p>
          </div>
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(booking.status, "booking")}`}>
            {getStatusLabel(booking.status, "booking")}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-semibold mb-4">Status Booking</h2>
        <div className="flex items-center gap-0">
          {TIMELINE_STEPS.map((step, i) => {
            const isActive = currentStepIndex >= i
            const isCurrent = TIMELINE_STEPS[currentStepIndex]?.key === step.key
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center relative">
                {i > 0 && (
                  <div className={`absolute top-4 right-1/2 w-full h-0.5 ${isActive ? "bg-emerald-500" : "bg-border"}`} />
                )}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  isCurrent ? "bg-emerald-600 text-white" : isActive ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
                }`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <p className={`text-xs mt-2 text-center ${isCurrent ? "font-semibold text-emerald-600" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>
        {booking.status === "cancelled" && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
            <XCircle className="w-4 h-4" />
            Booking ini telah dibatalkan
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Info */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Detail Paket
          </h2>
          <div className="space-y-3 text-sm">
            {pkg?.departure_city && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{pkg.departure_city}</span>
              </div>
            )}
            {pkg?.duration_days && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{pkg.duration_days} hari</span>
              </div>
            )}
            {pkg?.airline && (
              <div className="flex items-center gap-3">
                <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{pkg.airline}</span>
              </div>
            )}
            {pkg?.hotel_makkah && (
              <div className="flex items-center gap-3">
                <Hotel className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Makkah: {pkg.hotel_makkah} {pkg.hotel_makkah_stars && `⭐${pkg.hotel_makkah_stars}`}</span>
              </div>
            )}
            {pkg?.hotel_madinah && (
              <div className="flex items-center gap-3">
                <Hotel className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Madinah: {pkg.hotel_madinah} {pkg.hotel_madinah_stars && `⭐${pkg.hotel_madinah_stars}`}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Informasi Pembayaran
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Harga Paket ({booking.pilgrim_count} jamaah)</span>
              <span>{formatRupiah(booking.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Biaya Layanan</span>
              <span>{formatRupiah(booking.fee)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-emerald-600">{formatRupiah(booking.total)}</span>
            </div>
          </div>
        </div>

        {/* Pilgrims */}
        {booking.participants && booking.participants.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6 lg:col-span-2 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Data Jamaah ({booking.participants.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nama Lengkap</th>
                    <th className="pb-2 font-medium">NIK</th>
                    <th className="pb-2 font-medium">Paspor</th>
                    <th className="pb-2 font-medium">Jenis Kelamin</th>
                    <th className="pb-2 font-medium">Telepon</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.participants.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">{p.full_name}</td>
                      <td className="py-3">{p.nik || "-"}</td>
                      <td className="py-3">{p.passport_no || "-"}</td>
                      <td className="py-3">{p.gender === "male" ? "Laki-laki" : p.gender === "female" ? "Perempuan" : "-"}</td>
                      <td className="py-3">{p.phone || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {booking.status === "pending_payment" && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold mb-3">Aksi</h2>
          <button className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors">
            Bayar Sekarang
          </button>
        </div>
      )}
    </div>
  )
}
