"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar, MapPin, Plane, Hotel, Users, CreditCard, FileText, CheckCircle, Clock, XCircle, Loader2, Copy } from "lucide-react"
import { formatRupiah, getStatusColor, getStatusLabel } from "@/lib/constants"
import { toast } from "sonner"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"
import { Ban, X } from "lucide-react"

const CANCEL_REASONS = [
  "Perubahan jadwal pribadi",
  "Masalah biaya / dana",
  "Dapat paket lain yang lebih baik",
  "Keberangkatan kurang sesuai",
  "Lainnya",
]

interface BookingDetail {
  id: string
  status: string
  pilgrim_count: number
  price: number
  total: number
  paid_amount: number
  remaining_balance: number
  booking_channel: string
  notes: string | null
  created_at: string
  paid_at: string | null
  payment_method: string | null
  dp_type: string | null
  dp_percentage: number | null
  dp_amount: number | null
  remaining_amount: number | null
  remaining_due_date: string | null
  booking_source?: string
  payment_status?: string
  cancel_reason?: string | null
  refund: { id: string; amount: number; reason?: string | null; status: string; method: string | null; completed_at: string | null } | null
  package: { name: string; slug: string; departure_city: string | null; duration_nights: number | null; airline?: string | null; hotel_makkah?: string | null; hotel_makkah_stars?: number | null; hotel_madinah?: string | null; hotel_madinah_stars?: number | null } | null
  participants: { id: string; full_name: string; national_id: string | null; passport_number: string | null; gender: string | null; phone: string | null; relation: string }[]
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const supabase = createClient()

  const TIMELINE_STEPS = [
    { key: "pending_payment", label: t("booking.booking_created"), icon: Clock },
    { key: "processing", label: t("booking.status_processing"), icon: Loader2 },
    { key: "confirmed", label: t("booking.status_confirmed"), icon: CheckCircle },
    { key: "completed", label: t("booking.status_completed"), icon: CheckCircle },
  ]
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // Track auth state with onAuthStateChange — handles hydration delay after Midtrans redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[DEBUG BOOKING PAGE] onAuthStateChange:", { event: _event, userId: session?.user?.id, email: session?.user?.email })
      setUser(session?.user ?? null)
      setAuthChecked(true)
    })
    // Also get current session immediately
    supabase.auth.getUser().then(({ data: { user: u }, error }) => {
      console.log("[DEBUG BOOKING PAGE] getUser result:", { userId: u?.id, email: u?.email, error: error?.message })
      setUser(u)
      setAuthChecked(true)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  // Load booking data — ALWAYS tries API first (bypasses RLS), falls back to client query
  useEffect(() => {
    if (!authChecked) return // Wait for auth state to be determined

    let cancelled = false

    async function load() {
      console.log("[DEBUG BOOKING LOAD] Starting load for booking:", params.id, "authChecked:", authChecked, "user:", user?.id)

      const selectFields = "*, package:packages(name, slug, departure_city, duration_nights), participants:booking_participants(id, full_name, national_id, passport_number, gender, phone, relation)"

      let bookingData: any = null

      // Step 1: ALWAYS try API first (uses admin client, bypasses RLS)
      try {
        const res = await fetch("/api/booking/detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: params.id }),
        })
        const result = await res.json()
        console.log("[DEBUG BOOKING LOAD] API response:", { ok: res.ok, status: res.status, hasData: !!result.data, error: result.error })
        if (res.ok) {
          bookingData = result.data
        }
      } catch (e: any) {
        console.log("[DEBUG BOOKING LOAD] API fetch failed:", e?.message)
      }

      // Step 2: If API failed and user is logged in, try client-side Supabase query
      if (!bookingData && user) {
        console.log("[DEBUG BOOKING LOAD] Trying client-side Supabase query for user:", user.id)
        const { data, error } = await supabase
          .from("bookings")
          .select(selectFields)
          .eq("id", params.id)
          .eq("customer_id", user.id)
          .single()
        console.log("[DEBUG BOOKING LOAD] Client query result:", { hasData: !!data, error: error?.message, code: error?.code })
        bookingData = data
      }

      if (cancelled) return

      // Step 3: If still no booking found
      if (!bookingData) {
        console.log("[DEBUG BOOKING LOAD] No booking data found. user:", user?.id, "redirecting to login")
        if (!user) {
          router.push(`/login?redirect_to=/dashboard/bookings/${params.id}`)
          return
        }
        setBooking(null)
        setLoading(false)
        return
      }

      console.log("[DEBUG BOOKING LOAD] Booking loaded successfully:", { id: bookingData.id, status: bookingData.status, customer_id: bookingData.customer_id })
      setBooking(bookingData)
      setLoading(false)

      // Step 4: Verify Midtrans payment status if applicable
      if (bookingData.gateway_invoice_id) {
        const shouldVerify = bookingData.status === "pending_payment" ||
          (bookingData.status === "processing" && bookingData.dp_type === "dp" && (bookingData.remaining_amount || 0) > 0 && (bookingData.gateway_invoice_id?.startsWith("booking-remaining-") || bookingData.gateway_invoice_id?.endsWith("-R")))
        if (shouldVerify) {
          try {
            const res = await fetch("/api/booking/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bookingId: params.id }),
            })
            const result = await res.json()
            if (!cancelled && result.status && result.status !== bookingData.status) {
              setBooking((prev) => prev ? { ...prev, status: result.status, remaining_amount: result.status === "confirmed" ? 0 : prev.remaining_amount } : prev)
            }
          } catch (e) {
            console.error("Verify payment error:", e)
          }
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [params.id, authChecked, user, supabase, router])

  // Show skeleton while auth is being checked or data is loading
  if (loading || !authChecked) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-ivory-border/60 rounded animate-pulse" />
        <div className="h-32 bg-ivory-border/60 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-48 bg-ivory-border/60 rounded-2xl animate-pulse" />
          <div className="h-48 bg-ivory-border/60 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="bg-ivory-card rounded-2xl border border-ivory-border p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-ivory flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">{t("booking.not_found")}</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard/bookings" className="text-emerald-dark hover:underline text-sm">
              {t("booking.back_to_list")}
            </Link>
            {!user && (
              <Link href={`/login?redirect_to=/dashboard/bookings/${params.id}`} className="bg-emerald-dark text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-deep transition-colors">
                Masuk untuk Melihat Pesanan
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  const pkg = booking.package
  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.key === booking.status)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-ivory-card rounded-2xl border border-ivory-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("booking.booking_id")}</p>
            <h1 className="text-xl font-bold font-mono">{booking.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-muted-foreground mt-1">{pkg?.name || t("booking.package")}</p>
          </div>
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(booking.status, "booking")}`}>
            {getStatusLabel(booking.status, "booking")}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-ivory-card rounded-2xl border border-ivory-border p-6">
        <h2 className="font-semibold mb-4">{t("booking.status")}</h2>
        <div className="flex items-center gap-0">
          {TIMELINE_STEPS.map((step, i) => {
            const isActive = currentStepIndex >= i
            const isCurrent = TIMELINE_STEPS[currentStepIndex]?.key === step.key
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center relative">
                {i > 0 && (
                  <div className={`absolute top-4 right-1/2 w-full h-0.5 ${isActive ? "bg-emerald-dark/100" : "bg-border"}`} />
                )}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  isCurrent ? "bg-emerald-dark text-white" : isActive ? "bg-emerald-dark/10 text-emerald-dark" : "bg-ivory text-muted-foreground"
                }`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <p className={`text-xs mt-2 text-center ${isCurrent ? "font-semibold text-emerald-dark" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>
        {booking.status === "cancelled" && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
            <XCircle className="w-4 h-4" />
            {t("booking.status_cancelled")}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Info */}
        <div className="bg-ivory-card rounded-2xl border border-ivory-border p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t("booking.package")}
          </h2>
          <div className="space-y-3 text-sm">
            {pkg?.departure_city && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{pkg.departure_city}</span>
              </div>
            )}
            {pkg?.duration_nights && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{pkg.duration_nights} {t("package.day")}</span>
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
                <span>Makkah: {pkg.hotel_makkah} {pkg.hotel_makkah_stars ? `(${pkg.hotel_makkah_stars} bintang)` : ""}</span>
              </div>
            )}
            {pkg?.hotel_madinah && (
              <div className="flex items-center gap-3">
                <Hotel className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Madinah: {pkg.hotel_madinah} {pkg.hotel_madinah_stars ? `(${pkg.hotel_madinah_stars} bintang)` : ""}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-ivory-card rounded-2xl border border-ivory-border p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            {t("booking.payment_info")}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("booking.package")} ({booking.pilgrim_count})</span>
              <span>{formatRupiah(booking.price)}</span>
            </div>
            {booking.dp_type === "dp" && (
              <>
                <div className="border-t border-ivory-border pt-2 flex justify-between text-emerald-dark">
                  <span className="font-medium flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    DP {booking.dp_percentage}%
                  </span>
                  <span className="font-bold">{formatRupiah(booking.dp_amount || 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("booking.dp_remaining", { percent: "" })}</span>
                  <span className="font-medium">{formatRupiah(booking.remaining_amount || 0)}</span>
                </div>
                {booking.remaining_due_date && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t("booking.due_date")}</span>
                    <span className="font-medium">
                      {new Date(booking.remaining_due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                )}
              </>
            )}
            <div className="border-t border-ivory-border pt-2 flex justify-between font-semibold">
              <span>{t("booking.total")}</span>
              <span className="text-emerald-dark">{formatRupiah(booking.total)}</span>
            </div>
          </div>
        </div>

        {/* Pilgrims */}
        {booking.participants && booking.participants.length > 0 && (
          <div className="bg-ivory-card rounded-2xl border border-ivory-border p-6 lg:col-span-2 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t("booking.participants")} ({booking.participants.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ivory-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{t("booking.personal_info")}</th>
                    <th className="pb-2 font-medium">NIK</th>
                    <th className="pb-2 font-medium">{t("booking.participants")}</th>
                    <th className="pb-2 font-medium">{t("checkout.gender")}</th>
                    <th className="pb-2 font-medium">{t("checkout.phone")}</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.participants.map((p) => (
                    <tr key={p.id} className="border-b border-ivory-border last:border-0">
                      <td className="py-3 font-medium">{p.full_name}</td>
                      <td className="py-3">{p.national_id || "-"}</td>
                      <td className="py-3">{p.passport_number || "-"}</td>
                      <td className="py-3">{p.gender === "male" ? t("checkout.gender_male") : p.gender === "female" ? t("checkout.gender_female") : "-"}</td>
                      <td className="py-3">{p.phone || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CancelStatusCard
        bookingId={booking.id}
        status={booking.status}
        cancelReason={booking.cancel_reason}
        refund={booking.refund}
      />

      {/* ── Payment Status Sections (3 conditions) ── */}
      <PaymentStatusSection
        bookingId={booking.id}
        status={booking.status}
        total={booking.total}
        paidAmount={booking.paid_amount}
        remainingBalance={booking.remaining_balance}
        paymentType={booking.dp_type}
        dpAmount={booking.dp_amount}
        dpPercentage={booking.dp_percentage}
        remainingAmount={booking.remaining_amount}
        remainingDueDate={booking.remaining_due_date}
        paidAt={booking.paid_at}
        paymentMethod={booking.payment_method}
        createdAt={booking.created_at}
      />
    </div>
  )
}

// ─── Cancel Status Card + Modal ──────────────────────────────────────────────

function CancelStatusCard({
  bookingId,
  status,
  cancelReason,
  refund,
}: {
  bookingId: string
  status: string
  cancelReason?: string | null
  refund: { id: string; amount: number; reason?: string | null; status: string; method: string | null; completed_at: string | null } | null
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  // ── Menunggu persetujuan travel ──
  if (status === "cancellation_pending") {
    return (
      <div className="bg-ivory-card rounded-2xl border border-gold/30 p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gold/15 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-gold-dark" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-deep">Menunggu Persetujuan Travel</h3>
            <p className="text-sm text-gold-dark">
              Permintaan pembatalanmu sudah terkirim. Travel akan menyetujui atau menolak. Danamu akan dikembalikan jika disetujui.
            </p>
          </div>
        </div>
        {refund?.reason ? (
          <div className="bg-gold/10 rounded-xl p-3 text-sm">
            <p className="text-xs text-muted-foreground mb-1">Alasan kamu</p>
            <p className="font-medium text-emerald-deep">{refund.reason}</p>
          </div>
        ) : cancelReason ? (
          <div className="bg-gold/10 rounded-xl p-3 text-sm">
            <p className="text-xs text-muted-foreground mb-1">Alasan kamu</p>
            <p className="font-medium text-emerald-deep">{cancelReason}</p>
          </div>
        ) : null}
      </div>
    )
  }

  if (status === "refunded" || status === "cancelled") {
    const refundStatus =
      refund?.status === "completed"
        ? "Refund selesai. Dana telah dikembalikan oleh travel."
        : refund?.status === "processing"
          ? "Refund sedang diproses oleh travel."
          : status === "refunded"
            ? "Refund akan diproses oleh travel."
            : null

    return (
      <div className="bg-ivory-card rounded-2xl border border-ivory-border p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${status === "refunded" ? "bg-ivory" : "bg-red-50"}`}>
            {status === "refunded"
              ? <CreditCard className={`w-6 h-6 ${refund?.status === "completed" ? "text-emerald-dark" : "text-slate-500"}`} />
              : <XCircle className="w-6 h-6 text-red-600" />}
          </div>
          <div>
            <h3 className="font-bold text-emerald-deep">
              {status === "refunded" ? "Pembayaran Dikembalikan" : t("booking.status_cancelled")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {status === "refunded" ? "Dana dikembalikan via travel partner." : "Pesanan dibatalkan."}
            </p>
          </div>
        </div>
        {cancelReason && (
          <div className="bg-ivory rounded-xl p-3 text-sm">
            <p className="text-xs text-muted-foreground mb-1">Alasan kamu</p>
            <p className="font-medium text-emerald-deep">{cancelReason}</p>
          </div>
        )}
        {refundStatus && (
          <p className={`text-sm flex items-center gap-2 ${refund?.status === "completed" ? "text-emerald-dark" : "text-gold-dark"}`}>
            {refund?.status === "completed" ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            {refundStatus}
          </p>
        )}
      </div>
    )
  }

  if (!["pending_payment", "processing", "confirmed"].includes(status)) return null

  return (
    <>
      <div className="bg-ivory-card rounded-2xl border border-red-200/70 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <Ban className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-deep">Batalkan Pesanan</h3>
            <p className="text-sm text-muted-foreground">
              {status === "pending_payment" ? "Pesanan akan dibatalkan tanpa pengembalian dana (belum dibayar)." : "Dana akan dikembalikan oleh travel."}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          Batalkan Pesanan
        </button>
      </div>
      {open && <CancelBookingModal bookingId={bookingId} onClose={() => setOpen(false)} />}
    </>
  )
}

function CancelBookingModal({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [customReason, setCustomReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const reason = selected === "Lainnya" ? customReason.trim() : selected
    if (!reason) {
      toast.error("Pilih alasan pembatalan terlebih dahulu")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Pesanan berhasil dibatalkan")
        onClose()
        setTimeout(() => window.location.reload(), 600)
      } else {
        toast.error(data.error || "Gagal membatalkan pesanan")
      }
    } catch {
      toast.error(t("checkout.network_error"))
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-ivory-card rounded-2xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-lg text-emerald-deep">Batalkan Pesanan</h3>
            <p className="text-sm text-muted-foreground">Yakin ingin membatalkan pesanan ini? Dana akan dikembalikan oleh travel.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-ivory transition-colors cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2">
          {CANCEL_REASONS.map((reason) => (
            <label
              key={reason}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selected === reason ? "border-red-300 bg-red-50" : "border-ivory-border hover:bg-ivory-border/50"
              }`}
            >
              <input
                type="radio"
                name="cancel-reason"
                checked={selected === reason}
                onChange={() => setSelected(reason)}
                className="accent-red-600"
              />
              <span className="text-sm font-medium text-emerald-deep">{reason}</span>
            </label>
          ))}
        </div>

        {selected === "Lainnya" && (
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Tulis alasanmu di sini…"
            rows={3}
            className="mt-3 w-full p-3 rounded-xl border border-ivory-border text-sm outline-none focus:border-red-300 resize-none"
          />
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-ivory-border/60 text-muted-foreground hover:bg-ivory-border/70 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Ya, Batalkan
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Payment Status Section (4-condition rendering) ──────────────────────────

function PaymentStatusSection({
  bookingId, status, total, paidAmount, remainingBalance,
  paymentType, dpAmount, dpPercentage, remainingAmount,
  remainingDueDate, paidAt, paymentMethod, createdAt,
}: {
  bookingId: string
  status: string
  total: number
  paidAmount: number
  remainingBalance: number
  paymentType: string | null
  dpAmount: number | null
  dpPercentage: number | null
  remainingAmount: number | null
  remainingDueDate: string | null
  paidAt: string | null
  paymentMethod: string | null
  createdAt: string
}) {
  const { t } = useTranslation()

  const effectiveRemaining = remainingBalance > 0 ? remainingBalance : (remainingAmount || 0)
  const effectivePaid = paidAmount > 0 ? paidAmount : (total - effectiveRemaining)

  // ── KONDISI 1: Dikonfirmasi Travel ──
  // DP yang sudah diverifikasi travel tapi sisa pelunasan belum dibayar
  // → ditampilkan dengan tombol pelunasan sisa.
  if (status === "confirmed" || status === "completed") {
    const needsPelunasan = paymentType === "dp" && effectiveRemaining > 0

    if (needsPelunasan) {
      return (
        <div className="bg-ivory-card rounded-2xl border border-emerald-dark/20 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-dark/10 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-dark" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-deep">Dikonfirmasi Travel</h3>
              <p className="text-sm text-emerald-dark">DP telah diverifikasi. Selesaikan pelunasan sebelum keberangkatan.</p>
            </div>
          </div>
          <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-emerald-deep">Sisa Pelunasan</span>
              <span className="text-lg font-bold text-emerald-deep">{formatRupiah(effectiveRemaining)}</span>
            </div>
            {remainingDueDate && (
              <p className="text-xs text-gold-dark flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Wajib dilunasi maksimal {new Date(remainingDueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} sebelum keberangkatan.
              </p>
            )}
          </div>
          <PayRemainingSection bookingId={bookingId} remainingAmount={effectiveRemaining} />
        </div>
      )
    }

    return (
      <div className="bg-ivory-card rounded-2xl border border-emerald-dark/20 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-dark/10 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-dark" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-deep">Lunas & Dikonfirmasi</h3>
            <p className="text-sm text-emerald-dark">Dalam persiapan dokumen travel</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-ivory rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Dibayar</p>
            <p className="font-bold text-emerald-deep">{formatRupiah(effectivePaid)}</p>
          </div>
          <div className="bg-ivory rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Sisa</p>
            <p className="font-bold text-emerald-dark">Rp 0</p>
          </div>
          {paidAt && (
            <div className="bg-ivory rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Dibayar pada</p>
              <p className="font-medium text-emerald-deep">
                {new Date(paidAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          )}
          {paymentMethod && (
            <div className="bg-ivory rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Metode</p>
              <p className="font-medium text-emerald-deep">{paymentMethod}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── KONDISI 2: Sudah Bayar, Menunggu Konfirmasi Travel Agent ──
  // status === 'processing'
  if (status === "processing") {
    const needsPelunasan = paymentType === "dp" && effectiveRemaining > 0
    return (
      <div className="bg-ivory-card rounded-2xl border border-ivory-border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-dark/10 rounded-xl flex items-center justify-center shrink-0">
            <Loader2 className="w-6 h-6 text-emerald-dark animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-deep">Menunggu Konfirmasi Travel</h3>
            <p className="text-sm text-emerald-dark">Pembayaran telah kami terima. Travel partner sedang memverifikasi dana masuk. Setelah diverifikasi, booking Anda dikonfirmasi dan sisa pelunasan dapat dibayarkan.</p>
          </div>
        </div>
        {needsPelunasan && (
          <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-emerald-deep">Sisa Pelunasan</span>
              <span className="text-lg font-bold text-emerald-deep">{formatRupiah(effectiveRemaining)}</span>
            </div>
            {remainingDueDate && (
              <p className="text-xs text-gold-dark flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Dapat dilunasi setelah booking dikonfirmasi travel (maksimal {new Date(remainingDueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}).
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── KONDISI 3: Belum Lunas, Perlu Pelunasan DP ──
  // effectiveRemaining > 0 AND status !== 'pending_payment'
  // (covers: cancelled with DP paid, refunded, etc.)
  if (effectiveRemaining > 0 && status !== "pending_payment") {
    return (
      <div className="bg-ivory-card rounded-2xl border border-ivory-border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gold/15 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-gold-dark" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-deep">Belum Lunas</h3>
            <p className="text-sm text-gold-dark">Sisa {formatRupiah(effectiveRemaining)} perlu dilunasi</p>
          </div>
        </div>
        <PayRemainingSection bookingId={bookingId} remainingAmount={effectiveRemaining} />
      </div>
    )
  }

  // ── KONDISI 4: Belum Bayar ──
  if (status === "pending_payment") {
    return (
      <div className="bg-ivory-card rounded-2xl border border-ivory-border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gold/15 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-gold-dark" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-deep">Menunggu Pembayaran</h3>
            <p className="text-sm text-gold-dark mt-0.5">
              Silakan selesaikan pembayaran untuk mengkonfirmasi booking Anda.
            </p>
          </div>
        </div>
        <PayNowSection bookingId={bookingId} total={total} />
      </div>
    )
  }

  // ── Default: cancelled / refunded (no payment action) ──
  return null
}

// ─── Pay Now Section (Full Payment) ──────────────────────────────────────────

function PayNowSection({ bookingId, total }: { bookingId: string; total: number }) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)

  const handlePay = async () => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/booking/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      })
      const data = await res.json()
      if (res.ok && data.snap) {
        window.location.href = data.snap.redirect_url || `https://app.sandbox.midtrans.com/snap/v2/vtweb/${data.snap.token}`
      } else {
        toast.error(data.error || t("common.error"))
      }
    } catch {
      toast.error(t("checkout.network_error"))
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div className="bg-ivory rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-1">{t("booking.booking_id")}</p>
        <div className="flex items-center gap-2">
          <p className="font-mono font-bold text-lg">{bookingId.slice(0, 8).toUpperCase()}</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(bookingId.slice(0, 8).toUpperCase())
              toast.success(t("booking.booking_id") + " ✓")
            }}
            className="p-1 hover:bg-ivory rounded transition-colors cursor-pointer"
          >
            <Copy className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      <button
        onClick={handlePay}
        disabled={submitting}
        className="w-full bg-emerald-dark text-white py-3 rounded-xl font-semibold hover:bg-emerald-deep transition-colors flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> {t("common.loading")}</>
        ) : (
          <><CreditCard className="w-4 h-4" /> {t("booking.pay_now")}</>
        )}
      </button>
    </div>
  )
}

// ─── Pay Remaining Section (DP Pelunasan) ────────────────────────────────────

function PayRemainingSection({ bookingId, remainingAmount }: { bookingId: string; remainingAmount: number }) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)

  const handlePay = async () => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/booking/pay-remaining", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      })
      const data = await res.json()
      if (res.ok && data.snap) {
        window.location.href = data.snap.redirect_url || `https://app.sandbox.midtrans.com/snap/v2/vtweb/${data.snap.token}`
      } else if (res.ok) {
        toast.success(t("booking.booking_success"))
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error(data.error || t("common.error"))
      }
    } catch {
      toast.error(t("checkout.network_error"))
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-3">
      <div className="w-full p-3 rounded-xl border-2 border-emerald-dark/25 bg-emerald-dark/5 flex items-center gap-3">
        <CreditCard className="w-5 h-5 text-emerald-dark" />
        <div className="flex-1">
          <p className="text-sm font-semibold">{t("booking.bank_transfer")}</p>
          <p className="text-xs text-muted-foreground">{t("booking.bank_transfer_desc")}</p>
        </div>
        <CheckCircle className="w-4 h-4 text-emerald-dark" />
      </div>

      <button
        onClick={handlePay}
        disabled={submitting}
        className="w-full bg-emerald-dark text-white py-3 rounded-xl font-semibold hover:bg-emerald-deep transition-colors flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> {t("common.loading")}</>
        ) : (
          <>Pelunasan Sisa Tagihan ({formatRupiah(remainingAmount)})</>
        )}
      </button>
    </div>
  )
}
