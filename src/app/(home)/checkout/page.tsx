"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ArrowLeft, Wallet, CreditCard, Users, CheckCircle, AlertCircle, MapPin, Clock, Plane, Hotel, Shield, Sparkles, ChevronRight, ChevronDown, ChevronUp, User, Phone, Heart } from "lucide-react"
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
  const packageSlug = searchParams.get("slug")

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
  const [expandedJemaah, setExpandedJemaah] = useState<Record<number, boolean>>({ 0: true })

  const STEPS = [
    { id: "package", label: "Data Singkat" },
    { id: "payment", label: "Pembayaran" },
    { id: "confirm", label: "Selesai" },
  ]

  const supabase = createClient()

  useEffect(() => {
    if (!packageSlug) return
    async function fetchData() {
      const { data: pkgData } = await supabase
        .from("packages")
        .select("*, travel:tenants(*)")
        .eq("slug", packageSlug)
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
  }, [packageSlug])

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

  const toggleJemaah = (idx: number) => {
    setExpandedJemaah((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

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
          <Link href="/search"><Button variant="outline">Cari Lagi</Button></Link>
        </div>
      </main>
    )
  }

  const totalPrice = pkg.price * pilgrimCount
  const dpAmount = paymentType === "dp" ? Math.round(totalPrice * dpPercentage / 100) : totalPrice
  const remainingAmount = paymentType === "dp" ? totalPrice - dpAmount : 0

  const feeBreakdown = calculateTotalFee(pkg.price, pilgrimCount, "portal")
  const amountToPayNow = paymentType === "dp" ? dpAmount + feeBreakdown.serviceFee : totalPrice + feeBreakdown.total
  const walletSufficient = walletBalance !== null && walletBalance >= amountToPayNow

  useEffect(() => {
    if (!walletSufficient && useWallet) setUseWallet(false)
  }, [walletSufficient])

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
      {/* Breadcrumb */}
      <div className="bg-white border-b border-border px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Beranda</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-primary">Cari Paket</Link>
          <span>/</span>
          <Link href={`/package/${pkg.slug}`} className="hover:text-primary truncate hidden sm:inline">{pkg.name}</Link>
          <span className="hidden sm:inline">/</span>
          <span className="text-foreground font-medium">Checkout</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-center max-w-lg mx-auto">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        i < step ? "bg-emerald-600 text-white" :
                        i === step ? "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md shadow-emerald-200" :
                        "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}>
                        {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${
                        i <= step ? "text-emerald-700" : "text-slate-400"
                      }`}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-14 sm:w-20 h-[3px] mx-2 sm:mx-3 rounded-full transition-colors ${
                        i < step ? "bg-emerald-500" : "bg-slate-200"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {step === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN — Form */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Info Banner */}
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs flex items-start gap-3">
                    <span className="text-base shrink-0 mt-0.5">ℹ️</span>
                    <p>
                      <strong>Informasi:</strong> Pada tahap ini Anda hanya perlu mengisi data kontak dasar.
                      Pengisian dokumen lengkap (Paspor, KTP, & Ukuran Baju) akan dilakukan pada Tahap 2 setelah pembayaran.
                    </p>
                  </div>

                  {/* Pilgrim Count */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <label className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-emerald-600" /> Jumlah Jemaah
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPilgrimCount(Math.max(1, pilgrimCount - 1))}
                        className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-bold text-lg flex items-center justify-center cursor-pointer"
                      >-</button>
                      <span className="w-12 text-center font-bold text-xl">{pilgrimCount}</span>
                      <button
                        onClick={() => setPilgrimCount(Math.min(20, pilgrimCount + 1))}
                        className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-bold text-lg flex items-center justify-center cursor-pointer"
                      >+</button>
                      <span className="text-xs text-slate-400 ml-2">maks. 20 jemaah</span>
                    </div>
                  </div>

                  {/* Dynamic Multi-Jamaah Forms */}
                  {pilgrims.map((pilgrim, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      {/* Accordion Header */}
                      <button
                        onClick={() => toggleJemaah(idx)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            idx === 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            <span className="text-sm font-bold">{idx + 1}</span>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-slate-900">
                              {pilgrim.full_name || `Jemaah ${idx + 1}`}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {idx === 0 ? "Jemaah Utama" : "Pendamping"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {pilgrim.full_name && pilgrim.phone && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                              Lengkap
                            </span>
                          )}
                          {expandedJemaah[idx] ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Accordion Body */}
                      {expandedJemaah[idx] && (
                        <div className="px-5 pb-5 space-y-3 border-t border-slate-100">
                          <div className="pt-4" />

                          {/* Nama Lengkap */}
                          <div>
                            <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                              <User className="w-3 h-3" /> Nama Lengkap *
                            </label>
                            <input
                              type="text"
                              value={pilgrim.full_name}
                              onChange={(e) => updatePilgrim(idx, "full_name", e.target.value)}
                              placeholder="Masukkan nama lengkap sesuai KTP"
                              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
                            />
                          </div>

                          {/* No. Telepon */}
                          <div>
                            <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                              <Phone className="w-3 h-3" /> No. Telepon / WhatsApp *
                            </label>
                            <input
                              type="tel"
                              inputMode="numeric"
                              value={pilgrim.phone}
                              onChange={(e) => { const v = e.target.value.replace(/[^0-9+]/g, "").replace(/\+/g, (m, i) => i === 0 ? m : "").slice(0, 15); updatePilgrim(idx, "phone", v) }}
                              placeholder="08xxx"
                              maxLength={15}
                              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
                            />
                          </div>

                          {/* Gender */}
                          <div>
                            <label className="text-xs font-medium text-slate-500 mb-2 block">Jenis Kelamin</label>
                            <div className="flex gap-3">
                              <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                                pilgrim.gender === "male"
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 hover:border-emerald-200 text-slate-500"
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
                                  ? "border-pink-400 bg-pink-50 text-pink-600"
                                  : "border-slate-200 hover:border-pink-200 text-slate-500"
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
                            <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                              <Heart className="w-3 h-3" /> Hubungan
                            </label>
                            <select
                              value={pilgrim.relation}
                              onChange={(e) => updatePilgrim(idx, "relation", e.target.value)}
                              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white transition-colors"
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
                      )}
                    </div>
                  ))}

                  {/* Mobile: Submit Button (visible below lg) */}
                  <div className="lg:hidden flex justify-end">
                    <Button onClick={() => setStep(1)} disabled={!allPilgrimsFilled} className="gap-2 px-6 w-full sm:w-auto">
                      Lanjut ke Pembayaran <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* RIGHT COLUMN — Sticky Summary */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h3 className="font-bold text-sm text-slate-900 mb-4">Ringkasan Pemesanan</h3>

                      {/* Package Info */}
                      <div className="flex gap-3 pb-4 border-b border-slate-100">
                        <div className="relative w-16 h-14 rounded-xl overflow-hidden shrink-0">
                          <Image src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"} alt={pkg.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-slate-400 truncate">{travel?.name}</p>
                          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{pkg.name}</p>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="py-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Harga per orang</span>
                          <span className="font-medium text-slate-900">{formatRupiah(pkg.price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Jumlah jemaah</span>
                          <span className="font-medium text-slate-900">x{pilgrimCount}</span>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-emerald-700 font-medium">Total Pembayaran</span>
                          <span className="text-lg font-bold text-emerald-800">{formatRupiah(totalPrice)}</span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Button
                        onClick={() => setStep(1)}
                        disabled={!allPilgrimsFilled}
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold shadow-md shadow-emerald-200 active:scale-[0.98] transition-all"
                      >
                        Lanjut ke Pembayaran <ChevronRight className="w-4 h-4" />
                      </Button>

                      {!allPilgrimsFilled && (
                        <p className="text-[10px] text-amber-600 text-center mt-2 flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Isi nama & telepon semua jemaah
                        </p>
                      )}
                    </div>

                    {/* Trust Signals */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold text-slate-700">Pembayaran Aman</span>
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-slate-500">
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /> Terenkripsi SSL 256-bit</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /> Dana disimpan di rekening berjalan</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /> PPIU Kemenag RI Terverifikasi</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT — Payment */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Payment Type */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                    <label className="text-sm font-semibold">Tipe Pembayaran</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentType("full")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${paymentType === "full" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-200"}`}
                      >
                        <CheckCircle className={`w-5 h-5 mb-1 ${paymentType === "full" ? "text-emerald-600" : "text-slate-400"}`} />
                        <p className="text-sm font-semibold">Bayar Full</p>
                        <p className="text-xs text-slate-500">Bayar lunas sekarang</p>
                      </button>
                      <button
                        onClick={() => setPaymentType("dp")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${paymentType === "dp" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-200"}`}
                      >
                        <Sparkles className={`w-5 h-5 mb-1 ${paymentType === "dp" ? "text-emerald-600" : "text-slate-400"}`} />
                        <p className="text-sm font-semibold">Bayar DP</p>
                        <p className="text-xs text-slate-500">Bayar sebagian dulu</p>
                      </button>
                    </div>

                    {paymentType === "dp" && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Besaran DP</p>
                        <div className="flex gap-2">
                          {DP_OPTIONS.map((pct) => {
                            const dpNominal = Math.round(totalPrice * pct / 100)
                            return (
                              <button
                                key={pct}
                                onClick={() => setDpPercentage(pct)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                                  dpPercentage === pct ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:border-emerald-200"
                                }`}
                              >
                                <span>{pct}%</span>
                                <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{formatRupiah(dpNominal)}</span>
                              </button>
                            )
                          })}
                        </div>
                        <p className="text-[11px] text-amber-600 mt-2 flex items-start gap-1.5">
                          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                          Sisa pelunasan ({formatRupiah(totalPrice - Math.round(totalPrice * dpPercentage / 100))}) wajib dibayarkan maksimal H-30 keberangkatan.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  {walletBalance !== null && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                      <label className="text-sm font-semibold">Metode Pembayaran</label>
                      
                      {/* Dompet Digital */}
                      {walletSufficient ? (
                        <button
                          onClick={() => setUseWallet(true)}
                          className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${useWallet ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-200"}`}
                        >
                          <Wallet className={`w-5 h-5 ${useWallet ? "text-emerald-600" : "text-slate-400"}`} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold">Dompet Digital</p>
                            <p className="text-xs text-emerald-600">Saldo: {formatRupiah(walletBalance)}</p>
                          </div>
                          <CheckCircle className={`w-4 h-4 ${useWallet ? "text-emerald-600" : "text-slate-300"}`} />
                        </button>
                      ) : (
                        <div className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed flex items-center gap-3">
                          <Wallet className="w-5 h-5 text-slate-300" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-400">Dompet Digital</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                                Saldo Tidak Cukup ({formatRupiah(walletBalance)})
                              </span>
                              <Link href="/dashboard/wallet" className="text-[10px] text-emerald-600 font-semibold hover:underline">
                                Top Up →
                              </Link>
                            </div>
                          </div>
                          <AlertCircle className="w-4 h-4 text-red-300" />
                        </div>
                      )}

                      {/* Transfer Bank */}
                      <button
                        onClick={() => setUseWallet(false)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${!useWallet ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-200"}`}
                      >
                        <div className="flex items-start gap-3">
                          <CreditCard className={`w-5 h-5 mt-0.5 shrink-0 ${!useWallet ? "text-emerald-600" : "text-slate-400"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">Transfer Bank / Virtual Account</p>
                            <p className="text-xs text-slate-500 mb-2">Bayar melalui bank pilihan Anda</p>
                            <div className="flex items-center gap-2">
                              {["BCA", "Mandiri", "BNI", "BRI", "Permata"].map((bank) => (
                                <span key={bank} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-semibold text-slate-600">
                                  {bank}
                                </span>
                              ))}
                            </div>
                          </div>
                          <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${!useWallet ? "text-emerald-600" : "text-slate-300"}`} />
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                    <label className="text-sm font-semibold">Catatan (Opsional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan untuk travel..."
                      rows={2}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
                    />
                  </div>

                  {/* Mobile: Back */}
                  <div className="lg:hidden flex justify-between">
                    <Button variant="outline" onClick={() => setStep(0)}>← Kembali</Button>
                    <Button onClick={() => setStep(2)} className="gap-2 px-6">Review <ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>

                {/* RIGHT — Sticky Summary */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h3 className="font-bold text-sm text-slate-900 mb-4">Ringkasan Pemesanan</h3>

                      <div className="flex gap-3 pb-4 border-b border-slate-100">
                        <div className="relative w-16 h-14 rounded-xl overflow-hidden shrink-0">
                          <Image src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"} alt={pkg.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-slate-400 truncate">{travel?.name}</p>
                          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{pkg.name}</p>
                        </div>
                      </div>

                      <div className="py-4 space-y-2 text-sm border-b border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Harga per orang</span>
                          <span className="font-medium">{formatRupiah(pkg.price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Jumlah jemaah</span>
                          <span className="font-medium">x{pilgrimCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Subtotal paket</span>
                          <span className="font-medium">{formatRupiah(totalPrice)}</span>
                        </div>
                        {paymentType === "dp" && (
                          <>
                            <div className="flex justify-between text-emerald-700">
                              <span className="font-medium">DP ({dpPercentage}%)</span>
                              <span className="font-semibold">{formatRupiah(dpAmount)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-amber-600">
                              <span>Sisa pelunasan</span>
                              <span className="font-medium">{formatRupiah(remainingAmount)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-500">Biaya layanan</span>
                          <span className="font-medium">{formatRupiah(feeBreakdown.totalPlatformFee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">PPN 11%</span>
                          <span className="font-medium">{formatRupiah(feeBreakdown.tax)}</span>
                        </div>
                      </div>

                      <div className="bg-emerald-50 rounded-xl p-4 mt-4 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-emerald-700 font-medium">Total Pembayaran</span>
                          <span className="text-lg font-bold text-emerald-800">{formatRupiah(totalPrice + feeBreakdown.total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-slate-500">Bayar sekarang</span>
                          <span className="font-bold text-emerald-700">{formatRupiah(amountToPayNow)}</span>
                        </div>
                      </div>

                      {paymentType === "dp" && (
                        <p className="text-[10px] text-amber-600 mb-3 flex items-start gap-1.5">
                          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                          Sisa pelunasan ({formatRupiah(remainingAmount)}) wajib dibayarkan maksimal H-30 keberangkatan.
                        </p>
                      )}

                      <Button
                        onClick={() => setStep(2)}
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold shadow-md shadow-emerald-200 active:scale-[0.98] transition-all"
                      >
                        Proses Pembayaran <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold text-slate-700">Pembayaran Aman</span>
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-slate-500">
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /> Terenkripsi SSL 256-bit</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /> Dana disimpan di rekening berjalan</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /> PPIU Kemenag RI Terverifikasi</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT — Review */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Fee Breakdown */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" /> Rincian Biaya
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Harga paket ({pilgrimCount} x {formatRupiah(pkg.price)})</span>
                        <span className="font-medium">{formatRupiah(totalPrice)}</span>
                      </div>
                      {paymentType === "dp" && (
                        <div className="flex justify-between text-emerald-700">
                          <span className="font-medium">DP ({dpPercentage}%)</span>
                          <span className="font-semibold">-{formatRupiah(dpAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Biaya layanan platform</span>
                        <span className="font-medium">{formatRupiah(feeBreakdown.totalPlatformFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Service fee</span>
                        <span className="font-medium">{formatRupiah(feeBreakdown.serviceFee)}</span>
                      </div>
                      <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-medium">{formatRupiah(feeBreakdown.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">PPN 11%</span>
                        <span className="font-medium">{formatRupiah(feeBreakdown.tax)}</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">Total</span>
                        <span className="text-xl font-bold text-emerald-800">{formatRupiah(totalPrice + feeBreakdown.total)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Bayar sekarang</span>
                        <span className="font-bold text-emerald-700">{formatRupiah(amountToPayNow)}</span>
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
                      className="text-xs text-emerald-600 hover:underline cursor-pointer"
                    >
                      {useWallet ? "Ganti metode pembayaran" : "Gunakan dompet digital"}
                    </button>
                  </div>

                  {/* Pilgrim Summary */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-semibold text-sm mb-3">Data Jemaah</h3>
                    <div className="space-y-2">
                      {pilgrims.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-emerald-700">{i + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{p.full_name}</p>
                            <p className="text-xs text-slate-400">{p.phone} · {p.gender === "male" ? "Laki-laki" : p.gender === "female" ? "Perempuan" : "-"} · {p.relation === "self" ? "Diri sendiri" : p.relation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
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

                  {/* Mobile: Actions */}
                  <div className="lg:hidden flex justify-between">
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
                          `Bayar Sekarang ${formatRupiah(amountToPayNow)}`
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Sticky Summary */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h3 className="font-bold text-sm text-slate-900 mb-4">Ringkasan Pemesanan</h3>

                      <div className="flex gap-3 pb-4 border-b border-slate-100">
                        <div className="relative w-16 h-14 rounded-xl overflow-hidden shrink-0">
                          <Image src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"} alt={pkg.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-slate-400 truncate">{travel?.name}</p>
                          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{pkg.name}</p>
                        </div>
                      </div>

                      <div className="py-4 space-y-2 text-sm border-b border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Harga per orang</span>
                          <span className="font-medium">{formatRupiah(pkg.price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Jumlah jemaah</span>
                          <span className="font-medium">x{pilgrimCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Subtotal paket</span>
                          <span className="font-medium">{formatRupiah(totalPrice)}</span>
                        </div>
                        {paymentType === "dp" && (
                          <>
                            <div className="flex justify-between text-emerald-700">
                              <span className="font-medium">DP ({dpPercentage}%)</span>
                              <span className="font-semibold">{formatRupiah(dpAmount)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-amber-600">
                              <span>Sisa pelunasan</span>
                              <span className="font-medium">{formatRupiah(remainingAmount)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-500">Biaya layanan</span>
                          <span className="font-medium">{formatRupiah(feeBreakdown.totalPlatformFee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">PPN 11%</span>
                          <span className="font-medium">{formatRupiah(feeBreakdown.tax)}</span>
                        </div>
                      </div>

                      <div className="bg-emerald-50 rounded-xl p-4 mt-4 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-emerald-700 font-medium">Total Pembayaran</span>
                          <span className="text-lg font-bold text-emerald-800">{formatRupiah(totalPrice + feeBreakdown.total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-slate-500">Bayar sekarang</span>
                          <span className="font-bold text-emerald-700">{formatRupiah(amountToPayNow)}</span>
                        </div>
                      </div>

                      {paymentType === "dp" && (
                        <p className="text-[10px] text-amber-600 mb-3 flex items-start gap-1.5">
                          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                          Sisa pelunasan ({formatRupiah(remainingAmount)}) wajib dibayarkan maksimal H-30 keberangkatan.
                        </p>
                      )}

                      <Button
                        onClick={handleSubmit}
                        disabled={submitting || (useWallet && !walletSufficient)}
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold shadow-md shadow-emerald-200 active:scale-[0.98] transition-all"
                      >
                        {submitting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                        ) : (
                          <>Bayar Sekarang <ChevronRight className="w-4 h-4" /></>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-2 mt-3">
                        <Link href={`/package/${pkg.slug}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-slate-400">Batal</Button>
                        </Link>
                        <span className="text-slate-200">|</span>
                        <Button variant="ghost" size="sm" className="text-xs text-slate-400" onClick={() => setStep(1)}>← Kembali</Button>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold text-slate-700">Pembayaran Aman</span>
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-slate-500">
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /> Terenkripsi SSL 256-bit</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /> Dana disimpan di rekening berjalan</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /> PPIU Kemenag RI Terverifikasi</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
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
