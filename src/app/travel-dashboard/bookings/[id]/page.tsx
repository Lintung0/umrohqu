"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatRupiah } from "@/lib/utils"
import { enrichPackagesWithCovers } from "@/lib/package-covers"
import {
  ArrowLeft, User, CreditCard, MapPin, Plane, Hotel, Calendar,
  CheckCircle, Clock, XCircle, Loader2, Phone, Mail, FileText,
  RotateCcw, X,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { Booking, Package } from "@/lib/types"
import { useTranslation } from "@/lib/i18n"
import CustomerDataDiriCard from "@/components/travel/customer-data-diri-card"

interface Participant {
  full_name: string
  national_id: string
  passport_number: string
  gender: string
  phone: string
}

interface BookingDetail extends Booking {
  packages?: Package
  departures?: { departure_city: string | null; departure_date: string | null }[]
  flights?: { airline_name: string | null; flight_number: string | null; departure_city: string | null }[]
  package_hotels?: { night_count: number | null; sort_order: number | null; hotel: { name: string | null; rating: number | null; city: string | null } | null }[]
  users?: { full_name: string; email: string; phone: string }
  booking_participants?: Participant[]
  cancel_reason?: string | null
  booking_refunds?: {
    id: string
    amount: number
    status: string
    method: string | null
    reference: string | null
    reason: string | null
    note: string | null
  }[]
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
    cancellation_pending: { label: "Menunggu Persetujuan", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: <Clock className="w-4 h-4" /> },
    refunded: { label: "Perlu Refund", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: <XCircle className="w-4 h-4" /> },
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
          packages(name, slug, duration_nights, price),
          departures:package_departures(departure_city, departure_date),
          flights:package_flights(airline_name, flight_number, departure_city),
          package_hotels:package_hotels(night_count, sort_order, hotel:hotels(name, rating, city)),
          users(full_name, email, phone),
          booking_participants(*),
          booking_refunds(id, amount, status, method, reference, reason, note)
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
                    {booking.departures?.[0]?.departure_city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {booking.departures[0].departure_city}</span>}
                    {booking.flights?.[0]?.airline_name && <span className="flex items-center gap-1"><Plane className="w-3.5 h-3.5" /> {booking.flights[0].airline_name}</span>}
                  </div>
                  {(booking.package_hotels ?? []).filter((ph) => ph.hotel?.name).length > 0 && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Hotel className="w-3.5 h-3.5" />{" "}
                      {booking.package_hotels!.map((ph) => ph.hotel?.name).filter(Boolean).join(" · ")}
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

          {/* Data Diri Lengkap Jamaah (hanya setelah dikonfirmasi) */}
          {["confirmed", "completed"].includes(booking.status) && (
            <CustomerDataDiriCard bookingId={booking.id} />
          )}

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

          {/* Manual refund / approval */}
          {(booking.status === "refunded" || booking.status === "cancellation_pending") && (
            <RefundCard
              bookingId={booking.id}
              amount={Number(booking.total || 0)}
              detail={booking}
              onUpdate={(patch) => setBooking((prev) => prev ? { ...prev, ...patch } : prev)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function RefundCard({
  bookingId,
  amount,
  detail,
  onUpdate,
}: {
  bookingId: string
  amount: number
  detail: BookingDetail
  onUpdate: (patch: Partial<BookingDetail>) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [amountInput, setAmountInput] = useState(String(amount))
  const [method, setMethod] = useState("Transfer Bank")
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const refund = detail.booking_refunds?.[0]

  const callRefundApi = async (action: string, payload?: Record<string, unknown>) => {
    const res = await fetch("/api/booking/refund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, action, ...payload }),
    })
    return { ok: res.ok, data: await res.json() }
  }

  const handleApprove = async () => {
    setSubmitting(true)
    const { ok, data } = await callRefundApi("approve")
    if (ok) { toast.success("Pembatalan disetujui"); window.location.reload() }
    else toast.error(data.error || "Gagal menyetujui")
    setSubmitting(false)
  }

  const handleReject = async () => {
    setSubmitting(true)
    const { ok, data } = await callRefundApi("reject", { note: reason || "Ditolak oleh travel" })
    if (ok) { toast.success("Pembatalan ditolak"); window.location.reload() }
    else toast.error(data.error || "Gagal menolak")
    setSubmitting(false)
  }

  const handleProcess = async () => {
    setSubmitting(true)
    const { ok, data } = await callRefundApi("process", {
      amount: Number(amountInput) || amount,
      method,
      reference,
      note,
    })
    if (ok) { toast.success("Refund dicatat"); window.location.reload() }
    else toast.error(data.error || "Gagal mencatat refund")
    setSubmitting(false)
  }

  const handleComplete = async () => {
    setSubmitting(true)
    const { ok, data } = await callRefundApi("complete")
    if (ok) { toast.success("Refund selesai"); window.location.reload() }
    else toast.error(data.error || "Gagal menandai selesai")
    setSubmitting(false)
  }

  const refundReason = refund?.reason || detail.cancel_reason
  const isPending = refund?.status === "pending"
  const isProcessing = refund?.status === "processing"
  const isCompleted = refund?.status === "completed"
  const hasMethod = isProcessing && refund?.method

  return (
    <div className={`rounded-2xl border p-6 space-y-4 ${
      isPending
        ? "bg-white border-amber-300"
        : isCompleted
          ? "bg-white border-emerald-200"
          : "bg-white border-amber-200"
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        {isPending
          ? <Clock className="w-4 h-4 text-amber-600" />
          : isCompleted
            ? <CheckCircle className="w-4 h-4 text-emerald-600" />
            : <RotateCcw className="w-4 h-4 text-amber-600" />
        }
        <h2 className={`font-semibold ${
          isPending ? "text-amber-800" : isCompleted ? "text-emerald-800" : "text-amber-800"
        }`}>
          {isPending ? "Permintaan Pembatalan" : isCompleted ? "Refund Selesai" : "Refund Manual"}
        </h2>
      </div>

      {/* Alasan */}
      {refundReason && (
        <div className="bg-slate-50 rounded-xl p-3 text-sm">
          <p className="text-xs text-muted-foreground mb-1">Alasan customer</p>
          <p className="font-medium text-slate-800">{refundReason}</p>
        </div>
      )}

      {/* Nominal */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Dana dikembalikan</span>
          <span className="font-bold text-amber-700">{formatRupiah(amount)}</span>
        </div>
        {hasMethod && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Metode</span>
            <span className="font-medium">{refund.method}{refund.reference ? ` • ${refund.reference}` : ""}</span>
          </div>
        )}
      </div>

      {/* ── Kondisi 1: Menunggu persetujuan ── */}
      {isPending && (
        <>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Catatan penolakan (opsional)…"
            rows={2}
            className="w-full p-3 rounded-xl border border-border text-sm outline-none focus:border-amber-300 resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleReject}
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Tolak
            </button>
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Setujui
            </button>
          </div>
        </>
      )}

      {/* ── Kondisi 2: Disetujui, belum catat manual ── */}
      {isProcessing && !hasMethod && (
        <>
          <button
            onClick={() => setOpen(true)}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Proses Refund (Manual)
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            Lakukan transfer dana secara manual ke customer, lalu catat detailnya di sini.
          </p>
        </>
      )}

      {/* ── Kondisi 3: Sudah catat, menunggu ditandai selesai ── */}
      {isProcessing && hasMethod && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            Transfer sudah dicatat. Tandai selesai jika sudah mengirim dana ke customer.
          </div>
          <button
            onClick={handleComplete}
            disabled={submitting}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Tandai Refund Selesai
          </button>
        </>
      )}

      {/* ── Kondisi 4: Selesai ── */}
      {isCompleted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle className="w-4 h-4" />
          Dana telah dikembalikan kepada customer.
        </div>
      )}

      {/* Modal Proses Refund Manual */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Proses Refund</h3>
                <p className="text-sm text-muted-foreground">Catat pengembalian dana manual ke customer.</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Nominal</label>
                <input type="number" value={amountInput} onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border text-sm outline-none focus:border-amber-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Metode</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border text-sm outline-none focus:border-amber-300 bg-white">
                  <option>Transfer Bank</option>
                  <option>E-Wallet</option>
                  <option>QRIS</option>
                  <option>Lainnya</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Nomor / Ref Transaksi</label>
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
                  placeholder="mis. INV123 / No transfer"
                  className="w-full p-3 rounded-xl border border-border text-sm outline-none focus:border-amber-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Catatan (opsional)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                  placeholder="Catatan proses refund…"
                  className="w-full p-3 rounded-xl border border-border text-sm outline-none focus:border-amber-300 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)} disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-muted text-muted-foreground hover:bg-muted/70 transition-colors disabled:opacity-50 cursor-pointer">
                Batal
              </button>
              <button onClick={handleProcess} disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
