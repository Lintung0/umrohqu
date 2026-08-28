"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Calendar, MapPin, Plane, Hotel, Users, CreditCard, FileText, CheckCircle, Clock, XCircle, Loader2, Copy, Sparkles } from "lucide-react"
import { formatRupiah, getStatusColor, getStatusLabel } from "@/lib/constants"
import { toast } from "sonner"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"

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
  payment_type: string | null
  dp_percentage: number | null
  dp_amount: number | null
  remaining_amount: number | null
  remaining_due_date: string | null
  booking_source?: string
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

  // Track auth state with onAuthStateChange — handles hydration delay after Xendit redirect
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

      // Step 4: Verify Xendit payment status if applicable
      if (bookingData.gateway_invoice_id) {
        const shouldVerify = bookingData.status === "pending_payment" ||
          (bookingData.status === "processing" && bookingData.payment_type === "dp" && (bookingData.remaining_amount || 0) > 0 && bookingData.gateway_invoice_id?.startsWith("booking-remaining-"))
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
        <div className="bg-white rounded-2xl border border-border p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-muted-foreground font-medium">{t("booking.not_found")}</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard/bookings" className="text-emerald-600 hover:underline text-sm">
              {t("booking.back_to_list")}
            </Link>
            {!user && (
              <Link href={`/login?redirect_to=/dashboard/bookings/${params.id}`} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {t("booking.back")}
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-6">
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
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-semibold mb-4">{t("booking.status")}</h2>
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
            {t("booking.status_cancelled")}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Info */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
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
            {t("booking.payment_info")}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("booking.package")} ({booking.pilgrim_count})</span>
              <span>{formatRupiah(booking.price)}</span>
            </div>
            {booking.payment_type === "dp" && (
              <>
                <div className="border-t border-border pt-2 flex justify-between text-emerald-600">
                  <span className="font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
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
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>{t("booking.total")}</span>
              <span className="text-emerald-600">{formatRupiah(booking.total)}</span>
            </div>
          </div>
        </div>

        {/* Pilgrims */}
        {booking.participants && booking.participants.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6 lg:col-span-2 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t("booking.participants")} ({booking.participants.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{t("booking.personal_info")}</th>
                    <th className="pb-2 font-medium">NIK</th>
                    <th className="pb-2 font-medium">{t("booking.participants")}</th>
                    <th className="pb-2 font-medium">{t("checkout.gender")}</th>
                    <th className="pb-2 font-medium">{t("checkout.phone")}</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.participants.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
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

      {/* ── Payment Status Sections (3 conditions) ── */}
      <PaymentStatusSection
        bookingId={booking.id}
        status={booking.status}
        total={booking.total}
        paidAmount={booking.paid_amount}
        remainingBalance={booking.remaining_balance}
        paymentType={booking.payment_type}
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

  // ── KONDISI 1: Lunas & Dikonfirmasi ──
  if (status === "confirmed" || status === "completed") {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-800">Lunas & Dikonfirmasi</h3>
            <p className="text-sm text-emerald-600">Dalam persiapan dokumen travel</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">Dibayar</p>
            <p className="font-bold text-slate-900">{formatRupiah(effectivePaid)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">Sisa</p>
            <p className="font-bold text-emerald-600">Rp 0</p>
          </div>
          {paidAt && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Dibayar pada</p>
              <p className="font-medium text-slate-700">
                {new Date(paidAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          )}
          {paymentMethod && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Metode</p>
              <p className="font-medium text-slate-700">{paymentMethod}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── KONDISI 2: Sudah Bayar, Menunggu Konfirmasi Travel Agent ──
  // status === 'processing'
  if (status === "processing") {
    // Check if this is a DP booking that still needs pelunasan
    const needsPelunasan = paymentType === "dp" && effectiveRemaining > 0

    return (
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-purple-800">Menunggu Konfirmasi</h3>
            <p className="text-sm text-purple-600">Travel partner sedang memverifikasi</p>
          </div>
        </div>

        {/* DP Pelunasan (if applicable) */}
        {needsPelunasan && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-amber-800">Sisa Pelunasan</span>
                <span className="text-lg font-bold text-amber-700">{formatRupiah(effectiveRemaining)}</span>
              </div>
              {remainingDueDate && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Wajib dilunasi maksimal {new Date(remainingDueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} sebelum keberangkatan.
                </p>
              )}
            </div>
            <PayRemainingSection bookingId={bookingId} remainingAmount={effectiveRemaining} />
          </>
        )}
      </div>
    )
  }

  // ── KONDISI 3: Belum Lunas, Perlu Pelunasan DP ──
  // effectiveRemaining > 0 AND status !== 'pending_payment'
  // (covers: cancelled with DP paid, refunded, etc.)
  if (effectiveRemaining > 0 && status !== "pending_payment") {
    return (
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-800">Belum Lunas</h3>
            <p className="text-sm text-amber-600">Sisa {formatRupiah(effectiveRemaining)} perlu dilunasi</p>
          </div>
        </div>
        <PayRemainingSection bookingId={bookingId} remainingAmount={effectiveRemaining} />
      </div>
    )
  }

  // ── KONDISI 4: Belum Bayar ──
  if (status === "pending_payment") {
    return (
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-800">Menunggu Pembayaran</h3>
            <p className="text-sm text-amber-600 mt-0.5">
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
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-1">{t("booking.booking_id")}</p>
        <div className="flex items-center gap-2">
          <p className="font-mono font-bold text-lg">{bookingId.slice(0, 8).toUpperCase()}</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(bookingId.slice(0, 8).toUpperCase())
              toast.success(t("booking.booking_id") + " ✓")
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
          >
            <Copy className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      <button
        onClick={handlePay}
        disabled={submitting}
        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-200 active:scale-[0.98] cursor-pointer"
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
      <div className="w-full p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 flex items-center gap-3">
        <CreditCard className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold">{t("booking.bank_transfer")}</p>
          <p className="text-xs text-muted-foreground">{t("booking.bank_transfer_desc")}</p>
        </div>
        <CheckCircle className="w-4 h-4 text-emerald-600" />
      </div>

      <button
        onClick={handlePay}
        disabled={submitting}
        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-200 active:scale-[0.98] cursor-pointer"
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
