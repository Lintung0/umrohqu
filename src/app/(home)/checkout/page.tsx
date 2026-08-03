"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ArrowLeft, Wallet, CreditCard, Users, CheckCircle, AlertCircle, MapPin, Clock, Plane, Hotel, Shield, Sparkles, ChevronRight, User, Phone, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import { calculateTotalFee } from "@/lib/business-logic/fees"
import { useTranslation } from "@/lib/i18n"
import type { Package, Tenant } from "@/lib/types"

const DP_OPTIONS = [30, 40, 50]

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useTranslation()
  const packageId = searchParams.get("package")

  const [pkg, setPkg] = useState<Package | null>(null)
  const [travel, setTravel] = useState<Tenant | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; bookingId?: string; error?: string; balance?: number; need?: number; xendit?: { invoice_url: string } } | null>(null)

  const [step, setStep] = useState(0)
  const [pilgrimCount, setPilgrimCount] = useState(1)
  const [pilgrims, setPilgrims] = useState<Array<{ full_name: string; phone: string; relation: string; gender: string }>>([])
  const [paymentType, setPaymentType] = useState<"full" | "dp">("full")
  const [dpPercentage, setDpPercentage] = useState(30)
  const [useWallet, setUseWallet] = useState(true)
  const [notes, setNotes] = useState("")

  const STEPS = [
    { id: "package", label: "Paket & Data Singkat" },
    { id: "payment", label: "Pembayaran" },
    { id: "confirm", label: "Konfirmasi" },
  ]

  const supabase = createClient()

  useEffect(() => {
    if (!packageId) return
    async function fetchData() {
      const { data: pkgData } = await supabase
        .from("packages")
        .select("*, travel:tenants(*)")
        .eq("id", packageId)
        .single()

      if (!pkgData) return
      setPkg(pkgData as any)
      setTravel((pkgData as any).travel as Tenant || null)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", user.id)
          .single()
        setWalletBalance(wallet?.balance || 0)
      }

      setLoading(false)
    }
    fetchData()
  }, [packageId])

  useEffect(() => {
    setPilgrims((prev) => {
      const next = [...prev]
      while (next.length < pilgrimCount) {
        next.push({ full_name: "", phone: "", relation: "self", gender: "" })
      }
      return next.slice(0, pilgrimCount)
    })
  }, [pilgrimCount])

  const updatePilgrim = (index: number, field: string, value: string) => {
    setPilgrims((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const allPilgrimsFilled = pilgrims.every((p) => p.full_name.trim().length > 0 && p.phone.trim().length > 0)

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Memuat data...</p>
        </div>
      </main>
    )
  }

  if (!pkg) {
    return (
      <main className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-semibold">Paket tidak ditemukan</p>
          <Link href="/search"><Button variant="outline">Cari paket lain</Button></Link>
        </div>
      </main>
    )
  }

  const totalPrice = pkg.price * pilgrimCount
  const dpAmount = paymentType === "dp" ? Math.round(totalPrice * dpPercentage / 100) : totalPrice
  const remainingAmount = paymentType === "dp" ? totalPrice - dpAmount : 0
  const walletSufficient = walletBalance !== null && walletBalance >= dpAmount

  const feeBreakdown = calculateTotalFee(pkg.price, pilgrimCount, "portal")

  const handleSubmit = async () => {
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          pilgrimCount,
          pilgrims: pilgrims.map((p) => ({
            full_name: p.full_name,
            phone: p.phone || null,
            gender: p.gender || null,
            relation: p.relation || "self",
          })),
          paymentType,
          dpPercentage: paymentType === "dp" ? dpPercentage : undefined,
          useWallet,
          notes,
          platformFee: feeBreakdown.totalPlatformFee,
          serviceFee: feeBreakdown.serviceFee,
          taxAmount: feeBreakdown.tax,
          feeChannel: "portal",
        }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.xendit?.invoice_url) {
          window.location.href = data.xendit.invoice_url
        } else {
          setResult({ success: true, bookingId: data.booking_id })
          setTimeout(() => router.push(`/dashboard/bookings/${data.booking_id}`), 2000)
        }
      } else {
        setResult({ success: false, error: data.error, balance: data.balance, need: data.need })
      }
    } catch {
      setResult({ success: false, error: "Terjadi kesalahan jaringan. Silakan coba lagi." })
    }
    setSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <div className="bg-white border-b border-border px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Beranda</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-primary">Cari Paket</Link>
          <span>/</span>
          <Link href={`/package/${pkg.slug}`} className="hover:text-primary truncate hidden sm:inline">{pkg.name}</Link>
          <span className="hidden sm:inline">/</span>
          <span className="text-foreground font-medium">Checkout</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {result?.success ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">Booking Berhasil!</h2>
            <p className="text-sm text-muted-foreground">Anda akan diarahkan ke halaman booking...</p>
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Stepper */}
            <div className="bg-white border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between max-w-xl mx-auto">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        i < step ? "bg-emerald-500 text-white" :
                        i === step ? "bg-emerald-500 text-white ring-4 ring-emerald-100" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={`text-[10px] font-medium mt-1 hidden sm:block ${
                        i <= step ? "text-emerald-700" : "text-muted-foreground"
                      }`}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-12 sm:w-20 h-0.5 mx-2 sm:mx-3 rounded-full ${
                        i < step ? "bg-emerald-500" : "bg-muted"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {step === 0 && (
              <>
                {/* Package Summary - Compact */}
                <div className="bg-white border border-border rounded-2xl p-4">
                  <div className="flex gap-3">
                    <div className="relative w-20 h-16 rounded-xl overflow-hidden shrink-0">
                      <Image src={pkg.image_url || "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80"} alt={pkg.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{travel?.name}</p>
                      <h3 className="font-semibold text-sm leading-snug line-clamp-1">{pkg.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                        {pkg.duration_days && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pkg.duration_days}H</span>}
                        {pkg.airline && <span className="flex items-center gap-1"><Plane className="w-3 h-3" />{pkg.airline}</span>}
                      </div>
                    </div>
                    <p className="text-base font-bold text-primary shrink-0">{formatRupiah(pkg.price)}<span className="text-[10px] text-muted-foreground font-normal block text-right">/org</span></p>
                  </div>
                </div>

                {/* Pilgrim Count */}
                <div className="bg-white border border-border rounded-2xl p-4">
                  <label className="text-sm font-semibold flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-primary" />Jumlah Jemaah</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPilgrimCount(Math.max(1, pilgrimCount - 1))} className="w-10 h-10 rounded-xl border border-border hover:bg-muted transition-colors font-bold text-lg flex items-center justify-center">-</button>
                    <span className="w-12 text-center font-bold text-xl">{pilgrimCount}</span>
                    <button onClick={() => setPilgrimCount(Math.min(20, pilgrimCount + 1))} className="w-10 h-10 rounded-xl border border-border hover:bg-muted transition-colors font-bold text-lg flex items-center justify-center">+</button>
                    <span className="text-xs text-muted-foreground ml-2">maks. 20 jemaah</span>
                  </div>
                </div>

                {/* Pilgrim Details - Simple (Name, Phone, Gender, Relation) */}
                {pilgrims.map((pilgrim, idx) => (
                  <div key={idx} className="bg-white border border-border rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        Jemaah {idx + 1}
                      </label>
                      {idx === 0 && <span className="text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded-full font-medium">Utama</span>}
                    </div>

                    <div className="space-y-3">
                      {/* Nama Lengkap */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <User className="w-3 h-3" /> Nama Lengkap *
                        </label>
                        <input
                          type="text"
                          value={pilgrim.full_name}
                          onChange={(e) => updatePilgrim(idx, "full_name", e.target.value)}
                          placeholder="Masukkan nama lengkap"
                          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
                        />
                      </div>

                      {/* No. Telepon */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> No. Telepon *
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={pilgrim.phone}
                          onChange={(e) => { const v = e.target.value.replace(/[^0-9+]/g, "").replace(/\+/g, (m, i) => i === 0 ? m : "").slice(0, 15); updatePilgrim(idx, "phone", v) }}
                          placeholder="08xxx"
                          maxLength={15}
                          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
                        />
                      </div>

                      {/* Gender - Radio Buttons */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-2 block">Jenis Kelamin</label>
                        <div className="flex gap-3">
                          <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                            pilgrim.gender === "male"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:border-primary/30 text-muted-foreground"
                          }`}>
                            <input
                              type="radio"
                              name={`gender-${idx}`}
                              value="male"
                              checked={pilgrim.gender === "male"}
                              onChange={(e) => updatePilgrim(idx, "gender", e.target.value)}
                              className="sr-only"
                            />
                            <span className="text-lg">👨</span> Laki-laki
                          </label>
                          <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                            pilgrim.gender === "female"
                              ? "border-pink-500 bg-pink-50 text-pink-600"
                              : "border-border hover:border-pink-300 text-muted-foreground"
                          }`}>
                            <input
                              type="radio"
                              name={`gender-${idx}`}
                              value="female"
                              checked={pilgrim.gender === "female"}
                              onChange={(e) => updatePilgrim(idx, "gender", e.target.value)}
                              className="sr-only"
                            />
                            <span className="text-lg">👩</span> Perempuan
                          </label>
                        </div>
                      </div>

                      {/* Hubungan */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Heart className="w-3 h-3" /> Hubungan
                        </label>
                        <select
                          value={pilgrim.relation}
                          onChange={(e) => updatePilgrim(idx, "relation", e.target.value)}
                          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white transition-colors"
                        >
                          <option value="self">Diri Sendiri</option>
                          <option value="spouse">Suami / Istri</option>
                          <option value="child">Anak</option>
                          <option value="parent">Orang Tua</option>
                          <option value="sibling">Saudara</option>
                          <option value="other">Lainnya</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <Button onClick={() => setStep(1)} disabled={!allPilgrimsFilled} className="gap-2 px-6">
                    Lanjut ke Pembayaran <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                {/* Payment Type */}
                <div className="bg-white border border-border rounded-2xl p-4 space-y-3">
                  <label className="text-sm font-semibold">Tipe Pembayaran</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentType("full")}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${paymentType === "full" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-200"}`}
                    >
                      <CheckCircle className={`w-5 h-5 mb-1 ${paymentType === "full" ? "text-emerald-600" : "text-muted-foreground"}`} />
                      <p className="text-sm font-semibold">Bayar Full</p>
                      <p className="text-xs text-muted-foreground">Bayar lunas sekarang</p>
                    </button>
                    <button
                      onClick={() => setPaymentType("dp")}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${paymentType === "dp" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-200"}`}
                    >
                      <Sparkles className={`w-5 h-5 mb-1 ${paymentType === "dp" ? "text-emerald-600" : "text-muted-foreground"}`} />
                      <p className="text-sm font-semibold">Bayar DP</p>
                      <p className="text-xs text-muted-foreground">Bayar sebagian dulu</p>
                    </button>
                  </div>

                  {paymentType === "dp" && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Besaran DP</p>
                      <div className="flex gap-2">
                        {DP_OPTIONS.map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setDpPercentage(pct)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                              dpPercentage === pct ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border hover:border-emerald-200"
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                {walletBalance !== null && (
                  <div className="bg-white border border-border rounded-2xl p-4 space-y-3">
                    <label className="text-sm font-semibold">Metode Pembayaran</label>
                    <button
                      onClick={() => setUseWallet(true)}
                      className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${useWallet ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-200"}`}
                    >
                      <Wallet className={`w-5 h-5 ${useWallet ? "text-emerald-600" : "text-muted-foreground"}`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Dompet Digital</p>
                        <p className={`text-xs ${walletSufficient ? "text-emerald-600" : "text-red-500"}`}>
                          Saldo: {formatRupiah(walletBalance)}
                          {!walletSufficient && ` (${formatRupiah(dpAmount - walletBalance)} kurang)`}
                        </p>
                      </div>
                      <CheckCircle className={`w-4 h-4 ${useWallet ? "text-emerald-600" : "text-muted-foreground/30"}`} />
                    </button>
                    <button
                      onClick={() => setUseWallet(false)}
                      className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${!useWallet ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-200"}`}
                    >
                      <CreditCard className={`w-5 h-5 ${!useWallet ? "text-emerald-600" : "text-muted-foreground"}`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Transfer Bank</p>
                        <p className="text-xs text-muted-foreground">Bayar via invoice Xendit</p>
                      </div>
                      <CheckCircle className={`w-4 h-4 ${!useWallet ? "text-emerald-600" : "text-muted-foreground/30"}`} />
                    </button>
                  </div>
                )}

                {/* Notes */}
                <div className="bg-white border border-border rounded-2xl p-4 space-y-3">
                  <label className="text-sm font-semibold">Catatan (Opsional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan untuk travel..."
                    rows={2}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(0)}>← Kembali</Button>
                  <Button onClick={() => setStep(2)} className="gap-2 px-6">
                    Review Pesanan <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Fee Breakdown */}
                <div className="bg-white border border-border rounded-2xl p-4 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" /> Ringkasan Pesanan
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Harga paket ({pilgrimCount} x {formatRupiah(pkg.price)})</span>
                      <span className="font-medium">{formatRupiah(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Biaya layanan platform</span>
                      <span className="font-medium">{formatRupiah(feeBreakdown.totalPlatformFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service fee</span>
                      <span className="font-medium">{formatRupiah(feeBreakdown.serviceFee)}</span>
                    </div>
                    <div className="border-t border-dashed border-border pt-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatRupiah(feeBreakdown.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PPN 11%</span>
                      <span className="font-medium">{formatRupiah(feeBreakdown.tax)}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">Total</span>
                      <span className="text-xl font-bold text-primary">{formatRupiah(totalPrice + feeBreakdown.total)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Bayar sekarang</span>
                      <span className="font-bold text-emerald-700">{formatRupiah(dpAmount + (paymentType === "full" ? feeBreakdown.total : 0))}</span>
                    </div>
                  </div>

                  {paymentType === "dp" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Sisa pembayaran: {100 - dpPercentage}%</p>
                        <p className="text-amber-700 mt-0.5">Anda perlu membayar {formatRupiah(remainingAmount)} lagi setelah ini</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setUseWallet(!useWallet)}
                    className="text-xs text-primary hover:underline"
                  >
                    {useWallet ? "Ganti metode pembayaran" : "Gunakan dompet digital"}
                  </button>
                </div>

                {/* Pilgrim Summary */}
                <div className="bg-white border border-border rounded-2xl p-4">
                  <h3 className="font-semibold text-sm mb-3">Data Jemaah</h3>
                  <div className="space-y-2">
                    {pilgrims.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground">{p.phone} · {p.gender === "male" ? "Laki-laki" : p.gender === "female" ? "Perempuan" : "-"} · {p.relation === "self" ? "Diri sendiri" : p.relation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Data lengkap (NIK, alamat, KTP) dapat diisi setelah booking dibuat
                  </p>
                </div>

                {/* Error */}
                {result && !result.success && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {result.error}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>← Kembali</Button>
                  <div className="flex gap-2">
                    <Link href={`/package/${pkg.slug}`}>
                      <Button variant="ghost" size="sm" className="text-xs">Batal</Button>
                    </Link>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || (useWallet && !walletSufficient)}
                      className="gap-2 px-6"
                    >
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                      ) : (
                        `Bayar ${formatRupiah(dpAmount)}`
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  )
}
