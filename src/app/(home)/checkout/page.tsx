"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { ArrowLeft, Users, CreditCard, Tag, CheckCircle, MapPin, Plane, Hotel, Clock, AlertCircle, Loader2, Copy, Check } from "lucide-react"
import { formatRupiah } from "@/lib/constants"
import { calculateTotalFee, applyFeePromo, BookingChannel, FeePromo, DEFAULT_FEE_CONFIG } from "@/lib/business-logic"
import { toast } from "sonner"

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-muted-foreground">Memuat...</p></div>}>
      <CheckoutContent />
    </Suspense>
  )
}

interface PackageRow {
  id: string
  name: string
  slug: string
  price: number
  description: string | null
  departure_city: string | null
  departure_date: string | null
  duration_days: number | null
  airline: string | null
  hotel_info: any
  image_url: string | null
  tenant_id: string
  quota: number
  available: number
  travel: { id: string; name: string; slug: string } | null
}

interface PilgrimData {
  full_name: string
  nik: string
  passport_no: string
  passport_expiry: string
  birth_date: string
  gender: "male" | "female"
  phone: string
}

interface PromoResult {
  valid: boolean
  discount: number
  message: string
  type?: "percent" | "fixed"
  min_booking?: number
}

const PAYMENT_METHODS = [
  { id: "va_bca", label: "Virtual Account BCA", bank: "BCA" },
  { id: "va_mandiri", label: "Virtual Account Mandiri", bank: "Mandiri" },
  { id: "va_bri", label: "Virtual Account BRI", bank: "BRI" },
  { id: "va_bni", label: "Virtual Account BNI", bank: "BNI" },
  { id: "ewallet_ovo", label: "OVO", bank: null },
  { id: "ewallet_dana", label: "DANA", bank: null },
  { id: "ewallet_gopay", label: "GoPay", bank: null },
  { id: "cc", label: "Kartu Kredit/Debit", bank: null },
]

function generateVirtualAccount(): string {
  const prefix = "880"
  const timestamp = Date.now().toString().slice(-10)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  return `${prefix}${timestamp}${random}`
}

function generatePaymentCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-"
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const packageId = searchParams.get("package") || ""
  const qty = Math.max(1, parseInt(searchParams.get("qty") || "1"))
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [pkg, setPkg] = useState<PackageRow | null>(null)
  const [loadingPkg, setLoadingPkg] = useState(true)
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({})

  const [pilgrims, setPilgrims] = useState<PilgrimData[]>(
    Array.from({ length: qty }, () => ({
      full_name: "",
      nik: "",
      passport_no: "",
      passport_expiry: "",
      birth_date: "",
      gender: "male" as const,
      phone: "",
    }))
  )
  const [promoCode, setPromoCode] = useState("")
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null)
  const [step, setStep] = useState<"data" | "payment">("data")
  const [paymentMethod, setPaymentMethod] = useState("va_bca")
  const [promoLoading, setPromoLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [paymentCode, setPaymentCode] = useState("")
  const [vaNumber, setVaNumber] = useState("")
  const [copied, setCopied] = useState(false)
  const [channel] = useState<BookingChannel>("portal")

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (packageId) {
        const { data } = await supabase
          .from("packages")
          .select("*, travel:tenants(id, name, slug)")
          .eq("id", packageId)
          .single()
        setPkg(data as any)
      }
      setLoadingPkg(false)
    }
    load()
  }, [packageId])

  const subtotal = pkg ? pkg.price * qty : 0
  const feeBreakdown = pkg ? calculateTotalFee(pkg.price, qty, channel) : null
  const feePromo: FeePromo | null = promoResult?.valid ? {
    code: promoCode,
    type: promoResult.type === "percent" ? "fee_percent" : "fee_amount",
    value: promoResult.discount,
    appliesTo: "all",
    validFrom: "2026-01-01",
    validUntil: "2026-12-31",
    isActive: true,
  } : null
  const finalFees = feeBreakdown && feePromo ? applyFeePromo(feeBreakdown, feePromo) : feeBreakdown
  const discount = feeBreakdown && finalFees && feePromo ? (feeBreakdown.total - finalFees.total) : 0
  const total = subtotal + (finalFees?.total || 0) - discount

  function validatePilgrims(): boolean {
    const errors: Record<number, string[]> = {}
    let hasError = false

    pilgrims.forEach((p, i) => {
      const pErrors: string[] = []
      if (!p.full_name.trim()) pErrors.push("Nama lengkap wajib diisi")
      if (!p.nik.trim()) pErrors.push("NIK wajib diisi")
      else if (p.nik.length !== 16 || !/^\d{16}$/.test(p.nik.trim())) pErrors.push("NIK harus 16 digit angka")
      if (!p.phone.trim()) pErrors.push("Nomor telepon wajib diisi")
      else if (!/^(\+?62|0)\d{9,13}$/.test(p.phone.trim().replace(/\s/g, ""))) pErrors.push("Format nomor telepon tidak valid")
      if (p.passport_expiry && new Date(p.passport_expiry) < new Date()) pErrors.push("Masa berlaku paspor sudah habis")

      if (pErrors.length > 0) {
        errors[i] = pErrors
        hasError = true
      }
    })

    setValidationErrors(errors)
    return !hasError
  }

  function updatePilgrim(index: number, field: keyof PilgrimData, value: string) {
    setPilgrims((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
    if (validationErrors[index]) {
      setValidationErrors((prev) => { const next = { ...prev }; delete next[index]; return next })
    }
  }

  async function applyPromo() {
    const code = promoCode.trim().toUpperCase()
    if (!code) return
    setPromoLoading(true)
    const { data } = await supabase
      .from("promotions")
      .select("discount_value, discount_type, is_active, valid_from, valid_until, min_booking, max_usage, usage_count")
      .eq("code", code)
      .single()
    setPromoLoading(false)
    if (data && data.is_active) {
      const now = new Date()
      if (data.valid_from && now < new Date(data.valid_from)) {
        setPromoResult({ valid: false, discount: 0, message: "Promo belum berlaku" })
      } else if (data.valid_until && now > new Date(data.valid_until)) {
        setPromoResult({ valid: false, discount: 0, message: "Promo sudah kedaluwarsa" })
      } else if (data.max_usage && data.usage_count >= data.max_usage) {
        setPromoResult({ valid: false, discount: 0, message: "Promo sudah mencapai batas penggunaan" })
      } else if (data.min_booking && subtotal < data.min_booking) {
        setPromoResult({ valid: false, discount: 0, message: `Minimal pembelian ${formatRupiah(data.min_booking)}` })
      } else {
        setPromoResult({ valid: true, discount: data.discount_value, message: `Promo "${code}" berhasil diterapkan!`, type: data.discount_type })
      }
    } else {
      setPromoResult({ valid: false, discount: 0, message: "Kode promo tidak valid" })
    }
  }

  async function handleSubmit() {
    if (!user || !pkg) return

    if (!validatePilgrims()) {
      toast.error("Mohon lengkapi data jamaah dengan benar")
      return
    }

    const availableSeats = pkg.available ?? pkg.quota
    if (qty > availableSeats) {
      toast.error(`Kursi tidak cukup. Tersisa ${availableSeats} kursi.`)
      return
    }

    setIsSubmitting(true)

    const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod)
    const isVA = paymentMethod.startsWith("va_")
    const generatedVA = isVA ? generateVirtualAccount() : ""
    const generatedCode = !isVA ? generatePaymentCode() : ""

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        package_id: pkg.id,
        tenant_id: pkg.tenant_id,
        customer_id: user.id,
        booking_channel: "marketplace",
        status: "pending_payment",
        payment_status: "pending",
        pilgrim_count: qty,
        price: subtotal,
        fee: finalFees?.total || 0,
        total: total,
        payment_method: paymentMethod,
        va_number: generatedVA || null,
        payment_code: generatedCode || null,
        payment_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        notes: `Metode: ${selectedMethod?.label}`,
      })
      .select("id")
      .single()

    if (bookingError || !booking) {
      toast.error("Gagal membuat booking: " + (bookingError?.message || "Unknown error"))
      setIsSubmitting(false)
      return
    }

    const participants = pilgrims.map((p, i) => ({
      booking_id: booking.id,
      full_name: p.full_name,
      id_number: p.nik,
      nik: p.nik,
      passport_no: p.passport_no || null,
      passport_expiry: p.passport_expiry || null,
      birth_date: p.birth_date || null,
      gender: p.gender,
      phone: p.phone,
      relation: i === 0 ? "self" : "companion",
    }))

    await supabase.from("booking_participants").insert(participants)

    // Decrement available quota
    const newAvailable = availableSeats - qty
    await supabase
      .from("packages")
      .update({ available: Math.max(0, newAvailable) })
      .eq("id", pkg.id)

    // Auto-generate service fee invoice
    const { data: feeConfig } = await supabase
      .from("fee_config")
      .select("*")
      .limit(1)
      .single()

    if (feeConfig) {
      const serviceFee = Math.max(
        subtotal * ((feeConfig.service_fee_percent || 3) / 100),
        feeConfig.service_fee_flat || 300000
      )
      await supabase.from("invoices").insert({
        booking_id: booking.id,
        tenant_id: pkg.tenant_id,
        type: "service_fee",
        amount: serviceFee,
        description: `Biaya layanan booking #${booking.id.slice(0, 8).toUpperCase()}`,
        status: "pending",
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    // Increment promo usage if promo was used
    if (promoResult?.valid && promoCode) {
      const { data: promo } = await supabase
        .from("promotions")
        .select("usage_count")
        .eq("code", promoCode.trim().toUpperCase())
        .single()
      if (promo) {
        await supabase
          .from("promotions")
          .update({ usage_count: (promo.usage_count || 0) + 1 })
          .eq("code", promoCode.trim().toUpperCase())
      }
    }

    setBookingId(booking.id)
    setVaNumber(generatedVA)
    setPaymentCode(generatedCode)
    setIsSubmitting(false)
    setIsSuccess(true)
  }

  if (loadingPkg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Paket tidak ditemukan</p>
          <Link href="/search" className="text-emerald-600 hover:underline text-sm mt-2 inline-block">Cari Paket</Link>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod)
    const isVA = paymentMethod.startsWith("va_")
    const code = isVA ? vaNumber : paymentCode

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-border p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold">Booking Berhasil!</h1>
          <p className="text-muted-foreground text-sm">
            Silakan lakukan pembayaran dalam <strong>24 jam</strong>. Booking akan otomatis dibatalkan jika melewati batas waktu.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kode Booking</span>
              <span className="font-bold font-mono">{bookingId?.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Pembayaran</span>
              <span className="font-bold text-emerald-600">{formatRupiah(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Metode</span>
              <span>{selectedMethod?.label}</span>
            </div>
          </div>

          {code && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-3">
              <div>
                <p className="text-xs text-emerald-600 font-medium mb-1">{isVA ? "Virtual Account" : "Kode Pembayaran"}</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono font-bold text-emerald-700 tracking-wider">{code}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(code)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="p-1.5 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-600" />}
                  </button>
                </div>
              </div>
              <div className="text-xs text-emerald-700 space-y-1">
                <p>Transfer ke {isVA ? `Bank ${selectedMethod?.bank}` : selectedMethod?.label}</p>
                <p>Sebesar <strong>{formatRupiah(total)}</strong></p>
                <p>Batas waktu: <strong>{new Date(Date.now() + 24*60*60*1000).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong></p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href={bookingId ? `/dashboard/bookings/${bookingId}` : "/dashboard/bookings"}
              className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors text-center text-sm"
            >
              Lihat Booking
            </Link>
            <Link
              href="/"
              className="flex-1 border border-border py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center text-sm"
            >
              Kembali
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const hotelInfo = pkg.hotel_info as any

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 lg:p-8">
        <Link
          href={pkg.slug ? `/package/${pkg.slug}` : "/search"}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke paket
        </Link>

        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-emerald-600">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">1</span>
                Data Jamaah
              </div>
              <div className="flex-1 h-px bg-border" />
              <div className={`flex items-center gap-2 ${step === "payment" ? "text-emerald-600 font-medium" : "text-muted-foreground"}`}>
                <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${step === "payment" ? "bg-emerald-600 text-white" : "bg-border text-muted-foreground"}`}>2</span>
                Pembayaran
              </div>
            </div>

            {step === "data" && (
              <div className="space-y-4">
                {pilgrims.map((p, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-border p-5 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Jamaah {i + 1}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Nama Lengkap *</label>
                        <input type="text" value={p.full_name} onChange={(e) => updatePilgrim(i, "full_name", e.target.value)} placeholder="Sesuai paspor/KTP" className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${validationErrors[i]?.some(e => e.includes("Nama")) ? "border-red-300 bg-red-50" : "border-border"}`} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">NIK *</label>
                        <input type="text" value={p.nik} onChange={(e) => updatePilgrim(i, "nik", e.target.value)} placeholder="16 digit NIK" maxLength={16} className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${validationErrors[i]?.some(e => e.includes("NIK")) ? "border-red-300 bg-red-50" : "border-border"}`} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Nomor Paspor</label>
                        <input type="text" value={p.passport_no} onChange={(e) => updatePilgrim(i, "passport_no", e.target.value)} placeholder="A1234567" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Masa Berlaku Paspor</label>
                        <input type="date" value={p.passport_expiry} onChange={(e) => updatePilgrim(i, "passport_expiry", e.target.value)} className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${validationErrors[i]?.some(e => e.includes("paspor")) ? "border-red-300 bg-red-50" : "border-border"}`} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Tanggal Lahir</label>
                        <input type="date" value={p.birth_date} onChange={(e) => updatePilgrim(i, "birth_date", e.target.value)} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Jenis Kelamin *</label>
                        <select value={p.gender} onChange={(e) => updatePilgrim(i, "gender", e.target.value)} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                          <option value="male">Laki-laki</option>
                          <option value="female">Perempuan</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Telepon *</label>
                        <input type="tel" value={p.phone} onChange={(e) => updatePilgrim(i, "phone", e.target.value)} placeholder="08xxxxxxxxxx" className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${validationErrors[i]?.some(e => e.includes("telepon")) ? "border-red-300 bg-red-50" : "border-border"}`} />
                      </div>
                    </div>
                    {validationErrors[i] && validationErrors[i]!.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 space-y-1">
                        {validationErrors[i]!.map((err, ei) => <p key={ei}>• {err}</p>)}
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={() => {
                  if (validatePilgrims()) setStep("payment")
                }} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors">
                  Lanjut ke Pembayaran
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4" /> Metode Pembayaran</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PAYMENT_METHODS.map((method) => (
                      <label key={method.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${paymentMethod === method.id ? "border-emerald-500 bg-emerald-50" : "border-border hover:bg-gray-50"}`}>
                        <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-emerald-600" />
                        <span className="text-sm font-medium">{method.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-border p-5">
                  <h3 className="font-semibold flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4" /> Instruksi Pembayaran</h3>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                    <p>1. Selesaikan pembayaran sebelum <strong>24 jam</strong>.</p>
                    <p>2. Status akan otomatis terupdate setelah pembayaran dikonfirmasi.</p>
                    <p>3. Simpan bukti pembayaran untuk keperluan verifikasi.</p>
                    <p>4. Hubungi support@umrohq.com jika ada kendala pembayaran.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep("data")} className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-gray-50 transition-colors">Kembali</button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : `Bayar ${formatRupiah(total)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="bg-white rounded-2xl border border-border p-5 space-y-4 sticky top-24">
              <div className="flex gap-3">
                {pkg.image_url ? (
                  <Image src={pkg.image_url} alt={pkg.name} width={80} height={80} className="rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-muted shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{pkg.travel?.name}</p>
                  <p className="font-semibold text-sm">{pkg.name}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {pkg.departure_city && (
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5 shrink-0" /> <span>{pkg.departure_city}</span></div>
                )}
                {pkg.duration_days && (
                  <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-3.5 h-3.5 shrink-0" /> <span>{pkg.duration_days} hari</span></div>
                )}
                {pkg.airline && (
                  <div className="flex items-center gap-2 text-muted-foreground"><Plane className="w-3.5 h-3.5 shrink-0" /> <span>{pkg.airline}</span></div>
                )}
                {hotelInfo?.makkah && (
                  <div className="flex items-center gap-2 text-muted-foreground"><Hotel className="w-3.5 h-3.5 shrink-0" /> <span>Makkah: {hotelInfo.makkah}</span></div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Sisa <strong>{pkg.available ?? pkg.quota}</strong> kursi tersedia</span>
              </div>

              {finalFees && (
                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{formatRupiah(pkg.price)} × {qty} jamaah</span>
                    <span>{formatRupiah(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biaya platform · {formatRupiah(finalFees.platformFeePerPerson)}/orang × {qty}</span>
                    <span>{formatRupiah(finalFees.totalPlatformFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service fee</span>
                    <span>{formatRupiah(finalFees.serviceFee)}</span>
                  </div>
                  {finalFees.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pajak ({DEFAULT_FEE_CONFIG.taxPercent}%)</span>
                      <span>{formatRupiah(finalFees.tax)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Diskon fee</span>
                      <span>-{formatRupiah(discount)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Kode promo" className="flex-1 px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <button onClick={applyPromo} disabled={promoLoading} className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50">
                    {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pakai"}
                  </button>
                </div>
                {promoResult && <p className={`text-xs ${promoResult.valid ? "text-emerald-600" : "text-red-500"}`}>{promoResult.message}</p>}
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-emerald-600">{formatRupiah(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
