"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { ArrowLeft, Users, CreditCard, Tag, CheckCircle, MapPin, Plane, Hotel, Clock, AlertCircle, Loader2 } from "lucide-react"
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
}

const VALID_PROMOS: Record<string, { discount: number; type: "percent" | "fixed" }> = {
  RAMADHAN50: { discount: 50, type: "percent" },
  PAKET5: { discount: 1500000, type: "fixed" },
  NEWUSER20: { discount: 20, type: "percent" },
}

const PAYMENT_METHODS = [
  { id: "va_bca", label: "Virtual Account BCA" },
  { id: "va_mandiri", label: "Virtual Account Mandiri" },
  { id: "va_bri", label: "Virtual Account BRI" },
  { id: "va_bni", label: "Virtual Account BNI" },
  { id: "ewallet_ovo", label: "OVO" },
  { id: "ewallet_dana", label: "DANA" },
  { id: "ewallet_gopay", label: "GoPay" },
  { id: "cc", label: "Kartu Kredit/Debit" },
]

function CheckoutContent() {
  const searchParams = useSearchParams()
  const packageId = searchParams.get("package") || ""
  const qty = parseInt(searchParams.get("qty") || "1")
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [pkg, setPkg] = useState<PackageRow | null>(null)
  const [loadingPkg, setLoadingPkg] = useState(true)

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
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

  function updatePilgrim(index: number, field: keyof PilgrimData, value: string) {
    setPilgrims((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function applyPromo() {
    const code = promoCode.trim().toUpperCase()
    const promo = VALID_PROMOS[code]
    if (promo) {
      setPromoResult({ valid: true, discount: promo.discount, message: `Promo "${code}" berhasil diterapkan!`, type: promo.type })
    } else {
      setPromoResult({ valid: false, discount: 0, message: "Kode promo tidak valid" })
    }
  }

  async function handleSubmit() {
    if (!user || !pkg) return

    const hasEmpty = pilgrims.some((p) => !p.full_name || !p.nik)
    if (hasEmpty) {
      toast.error("Mohon lengkapi nama lengkap dan NIK untuk semua jamaah")
      return
    }

    setIsSubmitting(true)

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        package_id: pkg.id,
        tenant_id: pkg.tenant_id,
        customer_id: user.id,
        booking_channel: "marketplace",
        status: "pending_payment",
        pilgrim_count: qty,
        price: subtotal,
        fee: finalFees?.total || 0,
        total: total,
        notes: `Metode: ${PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}`,
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
      passport_no: p.passport_no,
      passport_expiry: p.passport_expiry || null,
      birth_date: p.birth_date || null,
      gender: p.gender,
      phone: p.phone,
      relation: i === 0 ? "self" : "companion",
    }))

    await supabase.from("booking_participants").insert(participants)

    setBookingId(booking.id)
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-border p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold">Booking Berhasil!</h1>
          <p className="text-muted-foreground">
            Booking Anda telah dibuat. Silakan lakukan pembayaran dalam 24 jam.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kode Booking</span>
              <span className="font-bold font-mono">{bookingId?.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Pembayaran</span>
              <span className="font-bold">{formatRupiah(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Metode</span>
              <span>{PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Link
              href={bookingId ? `/dashboard/bookings/${bookingId}` : "/dashboard/bookings"}
              className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors text-center"
            >
              Lihat Booking
            </Link>
            <Link
              href="/"
              className="flex-1 border border-border py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center"
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
                        <input type="text" value={p.full_name} onChange={(e) => updatePilgrim(i, "full_name", e.target.value)} placeholder="Sesuai paspor" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">NIK *</label>
                        <input type="text" value={p.nik} onChange={(e) => updatePilgrim(i, "nik", e.target.value)} placeholder="16 digit NIK" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Nomor Paspor</label>
                        <input type="text" value={p.passport_no} onChange={(e) => updatePilgrim(i, "passport_no", e.target.value)} placeholder="A1234567" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Masa Berlaku Paspor</label>
                        <input type="date" value={p.passport_expiry} onChange={(e) => updatePilgrim(i, "passport_expiry", e.target.value)} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
                        <label className="text-sm font-medium">Telepon</label>
                        <input type="tel" value={p.phone} onChange={(e) => updatePilgrim(i, "phone", e.target.value)} placeholder="08xxxxxxxxxx" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setStep("payment")} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors">
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
                    <p>2. Status akan otomatis terupdate setelah pembayaran.</p>
                    <p>3. Simpan bukti pembayaran.</p>
                    <p>4. WhatsApp <strong>+62 82232169960</strong> jika ada kendala.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep("data")} className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-gray-50 transition-colors">Kembali</button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : "Bayar Sekarang"}
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
                  <button onClick={applyPromo} className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors">Pakai</button>
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
