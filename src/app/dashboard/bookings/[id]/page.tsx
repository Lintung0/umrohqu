"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar, MapPin, Plane, Hotel, Users, CreditCard, FileText, CheckCircle, Clock, XCircle, Loader2, Copy, AlertTriangle, Check, Edit2, ShieldCheck, IdCard, PhoneCall, UserRound, ChevronDown, ChevronUp, Ban, X, ChevronRight } from "lucide-react"
import { formatRupiah, getStatusColor, getStatusLabel } from "@/lib/constants"
import { toast } from "sonner"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"
import { vtWebUrl } from "@/lib/services/midtrans-client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const GENDER_OPTIONS = [
  { value: "laki-laki", label: "Laki-laki" },
  { value: "perempuan", label: "Perempuan" },
]

const CANCEL_REASONS = [
  "Perubahan jadwal pribadi",
  "Masalah biaya / dana",
  "Dapat paket lain yang lebih baik",
  "Keberangkatan kurang sesuai",
  "Lainnya",
]

interface ParticipantData {
  id: string
  full_name: string
  national_id: string | null
  passport_number: string | null
  passport_expiry: string | null
  birth_date: string | null
  birth_place: string | null
  gender: string | null
  phone: string | null
  relation: string
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  street: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  village: string | null
  district: string | null
  rt_rw: string | null
}

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
  active_payment?: { id: string; status: string; gateway_reference: string | null; va_number: string | null; payment_provider: string | null; payment_type: string | null; amount: number | null } | null
  package: {
    name: string
    slug: string
    duration_nights: number | null
    departures: { departure_city: string | null; departure_date: string | null }[] | null
    flights: { airline_name: string | null; flight_number: string | null; departure_city: string | null }[] | null
    package_hotels: { night_count: number | null; sort_order: number | null; hotel: { name: string | null; rating: number | null; city: string | null } | null }[] | null
  } | null
  participants: ParticipantData[]
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const supabase = createClient()

  // Check for payment callback params
  const searchParams = useSearchParams()
  const isPaymentCallback = searchParams?.get("status") === "success" || searchParams?.get("payment_status") === "paid"
  if (isPaymentCallback) {
    // Force refresh after payment callback
    router.refresh()
  }

const STATUS_ACCENT: Record<string, string> = {
  pending_payment: "bg-gold-dark",
  processing: "bg-gold",
  cancellation_pending: "bg-gold",
  confirmed: "bg-emerald-dark",
  completed: "bg-emerald-dark",
  refunded: "bg-ivory-border",
  cancelled: "bg-red-500",
}

const STATUS_ACCENT_TEXT: Record<string, string> = {
  pending_payment: "text-gold-dark",
  processing: "text-gold-dark",
  cancellation_pending: "text-gold-dark",
  confirmed: "text-emerald-dark",
  completed: "text-emerald-dark",
  refunded: "text-muted-foreground",
  cancelled: "text-red-600",
}

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
  const [editingParticipant, setEditingParticipant] = useState<ParticipantData | null>(null)
  const [participantForm, setParticipantForm] = useState({
    passport_number: "",
    passport_expiry: "",
    birth_date: "",
    birth_place: "",
    gender: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    street: "",
    city: "",
    province: "",
    postal_code: "",
    village: "",
    district: "",
    rt_rw: "",
  })
  const [savingParticipant, setSavingParticipant] = useState(false)
  const [verifying, setVerifying] = useState(false)

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

      const selectFields = "*, package:packages(name, slug, duration_nights, departures:package_departures(departure_city, departure_date), flights:package_flights(airline_name, flight_number, departure_city), package_hotels:package_hotels(night_count, sort_order, hotel:hotels(name, rating, city))), participants(id, full_name, national_id, passport_number, passport_expiry, birth_date, birth_place, gender, phone, relation, emergency_contact_name, emergency_contact_phone, street, city, province, postal_code, village, district, rt_rw)"

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
      const shouldVerify = bookingData.status === "pending_payment" ||
        (bookingData.status === "processing" && bookingData.dp_type === "dp" && (bookingData.remaining_amount || 0) > 0)
      if (shouldVerify) {
        setVerifying(true)
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
        } finally {
          if (!cancelled) setVerifying(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [params.id, authChecked, user, supabase, router])

  // Handle editing participant data
  const handleEditParticipant = (p: ParticipantData) => {
    setEditingParticipant(p)
    setParticipantForm({
      passport_number: p.passport_number || "",
      passport_expiry: p.passport_expiry || "",
      birth_date: p.birth_date || "",
      birth_place: p.birth_place || "",
      gender: p.gender || "",
      emergency_contact_name: p.emergency_contact_name || "",
      emergency_contact_phone: p.emergency_contact_phone || "",
      street: p.street || "",
      city: p.city || "",
      province: p.province || "",
      postal_code: p.postal_code || "",
      village: p.village || "",
      district: p.district || "",
      rt_rw: p.rt_rw || "",
    })
  }

  const handleCloseParticipantModal = () => {
    setEditingParticipant(null)
    setParticipantForm({
      passport_number: "",
      passport_expiry: "",
      birth_date: "",
      birth_place: "",
      gender: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      street: "",
      city: "",
      province: "",
      postal_code: "",
      village: "",
      district: "",
      rt_rw: "",
    })
  }

  const handleParticipantFormChange = (field: string, value: string) => {
    setParticipantForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveParticipant = async () => {
    if (!editingParticipant || !user) return
    setSavingParticipant(true)
    try {
      // Optimistic update - update local state immediately
      const updatedParticipant = { ...editingParticipant, ...participantForm }
      setBooking((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === editingParticipant.id ? updatedParticipant : p
          ),
        }
      })

      const { error } = await supabase
        .from("participants")
        .update({
          passport_number: participantForm.passport_number,
          passport_expiry: participantForm.passport_expiry,
          birth_date: participantForm.birth_date,
          birth_place: participantForm.birth_place,
          gender: participantForm.gender,
          emergency_contact_name: participantForm.emergency_contact_name,
          emergency_contact_phone: participantForm.emergency_contact_phone,
          street: participantForm.street,
          city: participantForm.city,
          province: participantForm.province,
          postal_code: participantForm.postal_code,
          village: participantForm.village,
          district: participantForm.district,
          rt_rw: participantForm.rt_rw,
        })
        .eq("id", editingParticipant.id)
      if (error) throw error
      toast.success("Data jamaah berhasil disimpan")
      handleCloseParticipantModal()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data jamaah")
      // Rollback on error
      router.refresh()
    } finally {
      setSavingParticipant(false)
    }
  }

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

  // Participant Data Diri Modal - render at top level before main UI
  if (editingParticipant) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in-0 duration-200" onClick={handleCloseParticipantModal}>
          <div className="bg-ivory-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-ivory-border sticky top-0 bg-ivory-card z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
                  <UserRound className="w-5 h-5 text-gold-dark" />
                </div>
                <div>
                  <h2 className="font-semibold text-emerald-deep">Data Diri Jamaah</h2>
                  <p className="text-xs text-muted-foreground">{editingParticipant.full_name} • {editingParticipant.relation === "self" ? "Jamaah Utama" : "Pendamping"}</p>
                </div>
              </div>
              <button onClick={handleCloseParticipantModal} className="p-2 rounded-xl text-muted-foreground hover:text-emerald-dark hover:bg-ivory transition-colors" aria-label="Tutup">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveParticipant(); }} className="p-5 space-y-6">
              {/* Identitas & Paspor */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-dark" />
                  <h3 className="font-semibold text-sm text-emerald-deep">Identitas & Paspor</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Nomor Paspor</Label>
                    <Input
                      type="text"
                      value={participantForm.passport_number}
                      onChange={(e) => handleParticipantFormChange("passport_number", e.target.value)}
                      placeholder="A1234567"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Masa Berlaku Paspor</Label>
                    <Input
                      type="date"
                      value={participantForm.passport_expiry}
                      onChange={(e) => handleParticipantFormChange("passport_expiry", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Jenis Kelamin</Label>
                    <Select
                      value={participantForm.gender || undefined}
                      onValueChange={(v: string | null) => handleParticipantFormChange("gender", v || "")}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Tanggal Lahir</Label>
                    <Input
                      type="date"
                      value={participantForm.birth_date}
                      onChange={(e) => handleParticipantFormChange("birth_date", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Tempat Lahir</Label>
                    <Input
                      type="text"
                      value={participantForm.birth_place}
                      onChange={(e) => handleParticipantFormChange("birth_place", e.target.value)}
                      placeholder="Contoh: Jakarta"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Kontak Darurat */}
              <div className="space-y-4 pt-4 border-t border-ivory-border">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-dark" />
                  <h3 className="font-semibold text-sm text-emerald-deep">Kontak Darurat</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Nama Keluarga</Label>
                    <Input
                      type="text"
                      value={participantForm.emergency_contact_name}
                      onChange={(e) => handleParticipantFormChange("emergency_contact_name", e.target.value)}
                      placeholder="Nama keluarga / kerabat"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Nomor Telepon</Label>
                    <Input
                      type="tel"
                      value={participantForm.emergency_contact_phone}
                      onChange={(e) => handleParticipantFormChange("emergency_contact_phone", e.target.value)}
                      placeholder="08xxx"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Alamat */}
              <div className="space-y-4 pt-4 border-t border-ivory-border">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-dark" />
                  <h3 className="font-semibold text-sm text-emerald-deep">Alamat</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Alamat Lengkap</Label>
                    <Input
                      type="text"
                      value={participantForm.street}
                      onChange={(e) => handleParticipantFormChange("street", e.target.value)}
                      placeholder="Jalan, RT/RW, kelurahan"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">RT/RW</Label>
                    <Input
                      type="text"
                      value={participantForm.rt_rw}
                      onChange={(e) => handleParticipantFormChange("rt_rw", e.target.value)}
                      placeholder="002/005"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Kelurahan/Desa</Label>
                    <Input
                      type="text"
                      value={participantForm.village}
                      onChange={(e) => handleParticipantFormChange("village", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Kecamatan</Label>
                    <Input
                      type="text"
                      value={participantForm.district}
                      onChange={(e) => handleParticipantFormChange("district", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Kota/Kabupaten</Label>
                    <Input
                      type="text"
                      value={participantForm.city}
                      onChange={(e) => handleParticipantFormChange("city", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Provinsi</Label>
                    <Input
                      type="text"
                      value={participantForm.province}
                      onChange={(e) => handleParticipantFormChange("province", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Kode Pos</Label>
                    <Input
                      type="text"
                      value={participantForm.postal_code}
                      onChange={(e) => handleParticipantFormChange("postal_code", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            </form>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-ivory-border bg-ivory/50 rounded-b-2xl">
              <button
                onClick={handleCloseParticipantModal}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-ivory-border text-muted-foreground hover:bg-ivory transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveParticipant}
                disabled={savingParticipant}
                className="flex items-center gap-1.5 bg-emerald-dark text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-deep transition-colors disabled:opacity-50 text-sm cursor-pointer"
              >
                {savingParticipant ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {savingParticipant ? "Menyimpan..." : "Simpan"}
                {!savingParticipant && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </>
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
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("booking.booking_id")}</p>
            <h1 className="text-xl font-bold font-mono mt-1">{booking.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-muted-foreground mt-1">{pkg?.name || t("booking.package")}</p>
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <span className={`w-2 h-2 rounded-full ${STATUS_ACCENT[booking.status] ?? "bg-ivory-border"}`} />
            <span className={`text-[11px] uppercase tracking-[0.18em] font-medium ${STATUS_ACCENT_TEXT[booking.status] ?? "text-muted-foreground"}`}>
              {getStatusLabel(booking.status, "booking")}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-ivory-card rounded-2xl border border-ivory-border p-6">
        <div className="mb-8">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
            {t("booking.status")}
          </h2>
        </div>

        <div className="flex items-center">
          {TIMELINE_STEPS.map((step, i) => {
            const isDone = currentStepIndex > i
            const isCurrent = TIMELINE_STEPS[currentStepIndex]?.key === step.key
            const isActive = currentStepIndex >= i

            const nodeCls = isCurrent
              ? "w-4 h-4 bg-emerald-dark ring-[5px] ring-emerald-dark/10"
              : isDone
                ? "w-2.5 h-2.5 bg-emerald-dark/70"
                : "w-2.5 h-2.5 bg-ivory border border-ivory-border"

            return (
              <div key={step.key} className="flex-1 flex flex-col items-center relative">
                {i > 0 && (
                  <div className={`absolute top-[7px] right-1/2 w-full h-px ${isActive ? "bg-emerald-dark/40" : "bg-ivory-border"}`} />
                )}
                <div className={`relative transition-all duration-300 ${isCurrent ? "z-10" : ""} ${nodeCls} rounded-full flex items-center justify-center`}>
                  {isCurrent && <span className="w-1 h-1 rounded-full bg-white" />}
                </div>
                <p className={`mt-2.5 text-[10px] uppercase tracking-[0.16em] text-center leading-tight ${
                  isCurrent ? "font-semibold text-emerald-dark" : "text-muted-foreground/70"
                }`}>
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>

        {booking.status === "cancelled" && (
          <div className="mt-5 pt-4 border-t border-slate-200 flex items-center gap-2 text-sm text-red-600">
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
            {pkg?.departures?.[0]?.departure_city && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{pkg.departures[0].departure_city}</span>
              </div>
            )}
            {pkg?.duration_nights && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{pkg.duration_nights} {t("package.day")}</span>
              </div>
            )}
            {pkg?.departures?.[0]?.departure_date && (
              <div className="flex items-center gap-3">
                <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{new Date(pkg.departures[0].departure_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
            )}
            {(pkg?.flights?.length ?? 0) > 0 && (
              <div className="flex items-center gap-3">
                <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{pkg!.flights!.map((f) => [f.airline_name, f.flight_number, f.departure_city].filter(Boolean).join(" ")).join(", ")}</span>
              </div>
            )}
            {(pkg?.package_hotels?.length ?? 0) > 0 && (
              <div className="flex items-center gap-3">
                <Hotel className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>
                  {pkg!.package_hotels!
                    .map((ph) => {
                      const name = ph.hotel?.name
                      const rating = ph.hotel?.rating ? ` (${ph.hotel.rating} bintang)` : ""
                      const city = ph.hotel?.city ? `, ${ph.hotel.city}` : ""
                      return name ? `${name}${rating}${city}` : ""
                    })
                    .filter(Boolean)
                    .join(" · ")}
                </span>
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
                    <th className="pb-2 font-medium">Data Diri</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.participants.map((p) => {
                    const isComplete = [
                      p.passport_number,
                      p.passport_expiry,
                      p.birth_date,
                      p.birth_place,
                      p.gender,
                      p.emergency_contact_name,
                      p.emergency_contact_phone,
                      p.street,
                      p.city,
                      p.province,
                      p.postal_code,
                    ].every(Boolean)
                    return (
                      <tr key={p.id} className="border-b border-ivory-border last:border-0">
                        <td className="py-3 font-medium">{p.full_name}</td>
                        <td className="py-3">{p.national_id || "-"}</td>
                        <td className="py-3">{p.passport_number || "-"}</td>
                        <td className="py-3">{p.gender === "male" ? t("checkout.gender_male") : p.gender === "female" ? t("checkout.gender_female") : "-"}</td>
                        <td className="py-3">{p.phone || "-"}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              isComplete
                                ? "bg-emerald-dark/10 text-emerald-dark"
                                : "bg-gold/15 text-gold-dark"
                            }`}>
                              {isComplete ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Lengkap
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3" />
                                  Belum Lengkap
                                </>
                              )}
                            </span>
                            <button
                              onClick={() => handleEditParticipant(p)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-dark hover:bg-ivory transition-colors"
                              title="Isi Data Diri"
                              aria-label={`Isi data diri untuk ${p.full_name}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
        activePayment={booking.active_payment ?? null}
        verifying={verifying}
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
          <span className="w-9 h-9 rounded-full border border-gold/40 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-gold-dark" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold-dark font-medium">Menunggu Persetujuan</p>
            <h3 className="font-bold text-emerald-deep">Menunggu Persetujuan Travel</h3>
            <p className="text-sm text-muted-foreground mt-1">
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
          <span className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${status === "refunded" ? "border-emerald-dark/30" : "border-red-200"}`}>
            {status === "refunded"
              ? <CreditCard className={`w-4 h-4 ${refund?.status === "completed" ? "text-emerald-dark" : "text-slate-500"}`} />
              : <XCircle className="w-4 h-4 text-red-500" />}
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              {status === "refunded" ? "Refund" : "Pembatalan"}
            </p>
            <h3 className="font-bold text-emerald-deep">
              {status === "refunded" ? "Pembayaran Dikembalikan" : t("booking.status_cancelled")}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
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
          <span className="w-9 h-9 rounded-full border border-red-200 flex items-center justify-center shrink-0">
            <Ban className="w-4 h-4 text-red-500" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-red-500 font-medium">Tindakan</p>
            <h3 className="font-bold text-emerald-deep">Batalkan Pesanan</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
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
  activePayment, verifying,
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
  activePayment: { id: string; status: string; gateway_reference: string | null; va_number: string | null; payment_provider: string | null; payment_type: string | null; amount: number | null } | null
  verifying: boolean
}) {
  const { t } = useTranslation()

  const effectiveRemaining = remainingBalance > 0 ? remainingBalance : (remainingAmount || 0)
  const effectivePaid = paidAmount > 0 ? paidAmount : (total - effectiveRemaining)

  // Helper: check if fully paid (no remaining balance)
  const isFullyPaid = effectiveRemaining <= 0

  // Transaksi gateway aktif (VA sudah terbit, uang belum masuk)
  const hasActiveVA = !!activePayment && activePayment.status === "pending" && !!activePayment.gateway_reference

  const handleRecheck = () => window.location.reload()

  // ── KONDISI 0: Sedang verifikasi status ke gateway (tombol disembunyikan) ──
  if (verifying && status === "pending_payment" && !hasActiveVA) {
    return (
      <div className="bg-ivory-card rounded-2xl border border-ivory-border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gold/15 rounded-xl flex items-center justify-center shrink-0">
            <Loader2 className="w-6 h-6 text-gold-dark animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-deep">Memeriksa Pembayaran</h3>
            <p className="text-sm text-gold-dark mt-0.5">
              Kami sedang memastikan status pembayaran Anda ke gateway. Tunggu sebentar...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── KONDISI 1: LUNAS (Fully Paid) ──
  // Prioritaskan cek pembayaran penuh sebelum cek status
  if (isFullyPaid) {
    return (
      <div className="bg-ivory-card rounded-2xl border border-emerald-dark/20 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-dark/10 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-dark" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-deep">Lunas & Dikonfirmasi</h3>
            <p className="text-sm text-emerald-dark">Pembayaran penuh diterima. Dalam persiapan dokumen travel</p>
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

  // ── KONDISI 2: Dikonfirmasi Travel (DP paid, perlu pelunasan) ──
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

  // ── KONDISI 3B: VA sudah terbit, uang belum masuk ──
  // Tombol "Bayar" baru disembunyikan; user lanjutkan pembayaran yang sama
  if (status === "pending_payment" && hasActiveVA && activePayment) {
    return (
      <div className="bg-ivory-card rounded-2xl border border-ivory-border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gold/15 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-gold-dark" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-deep">Menunggu Pembayaran</h3>
            <p className="text-sm text-gold-dark mt-0.5">
              Selesaikan pembayaran Anda. Jangan buat pembayaran baru.
            </p>
          </div>
        </div>
        <div className="bg-ivory rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">
            {activePayment.payment_provider ? `${activePayment.payment_provider} Virtual Account` : "Virtual Account"}
          </p>
          <div className="flex items-center gap-2">
            <p className="font-mono font-bold text-lg">{activePayment.va_number || "Menyiapkan nomor VA..."}</p>
            {activePayment.va_number && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activePayment.va_number as string)
                  toast.success("Nomor VA disalin")
                }}
                className="p-1 hover:bg-ivory rounded transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <p className="text-sm font-semibold mt-1">{formatRupiah(activePayment.amount || total)}</p>
        </div>
        <button
          onClick={handleRecheck}
          className="w-full bg-emerald-dark text-white py-3 rounded-xl font-semibold hover:bg-emerald-deep transition-colors flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <><Loader2 className="w-4 h-4" /> Cek Status Pembayaran</>
        </button>
      </div>
    )
  }

  // ── KONDISI 4: Belum Bayar (belum ada transaksi gateway) ──
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
        window.location.href = data.snap.redirect_url || vtWebUrl(data.snap.token)
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
        window.location.href = data.snap.redirect_url || vtWebUrl(data.snap.token)
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
