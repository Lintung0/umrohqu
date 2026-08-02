"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ArrowLeft, Wallet, CreditCard, Users, CheckCircle, AlertCircle, MapPin, Clock, Plane, Hotel, Shield, BadgeCheck, Sparkles, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import { calculateTotalFee } from "@/lib/business-logic/fees"
import type { Package, Tenant } from "@/lib/types"

const DP_OPTIONS = [30, 40, 50]
const STEPS = [
  { id: "package", label: "Paket & Jamaah" },
  { id: "payment", label: "Pembayaran" },
  { id: "confirm", label: "Konfirmasi" },
]

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const packageId = searchParams.get("package")

  const [pkg, setPkg] = useState<Package | null>(null)
  const [travel, setTravel] = useState<Tenant | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; bookingId?: string; error?: string; balance?: number; need?: number; xendit?: { invoice_url: string } } | null>(null)

  const [step, setStep] = useState(0)
  const [pilgrimCount, setPilgrimCount] = useState(1)
  const [pilgrims, setPilgrims] = useState<Array<{ full_name: string; nik: string; passport_no: string; gender: string; phone: string; relation: string }>>([])
  const [savedParticipants, setSavedParticipants] = useState<Array<{ id: string; full_name: string; nik: string | null; passport_number: string | null; gender: string | null; phone: string | null }>>([])
  const [paymentType, setPaymentType] = useState<"full" | "dp">("full")
  const [dpPercentage, setDpPercentage] = useState(30)
  const [useWallet, setUseWallet] = useState(true)
  const [notes, setNotes] = useState("")

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

        const { data: parts } = await supabase
          .from("participants")
          .select("id, full_name, nik, passport_number, gender, phone")
          .eq("user_id", user.id)
          .order("is_main", { ascending: false })
        if (parts) setSavedParticipants(parts)
      }

      setLoading(false)
    }
    fetchData()
  }, [packageId])

  useEffect(() => {
    setPilgrims((prev) => {
      const next = [...prev]
      while (next.length < pilgrimCount) {
        next.push({ full_name: "", nik: "", passport_no: "", gender: "", phone: "", relation: "self" })
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

  const fillFromSaved = (index: number, saved: typeof savedParticipants[0]) => {
    setPilgrims((prev) => {
      const next = [...prev]
      next[index] = {
        full_name: saved.full_name,
        nik: saved.nik || "",
        passport_no: saved.passport_number || "",
        gender: saved.gender || "",
        phone: saved.phone || "",
        relation: "self",
      }
      return next
    })
  }

  const allPilgrimsFilled = pilgrims.every((p) => p.full_name.trim().length > 0)

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Memuat data checkout...</p>
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
          <Link href="/search"><Button variant="outline">Cari Paket Lain</Button></Link>
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
            nik: p.nik || null,
            passport_no: p.passport_no || null,
            gender: p.gender || null,
            phone: p.phone || null,
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
          setTimeout(() => router.push(`/dashboard/bookings/${data.booking_id}`), 1500)
        }
      } else {
        setResult({ success: false, error: data.error, balance: data.balance, need: data.need })
      }
    } catch {
      setResult({ success: false, error: "Terjadi kesalahan jaringan" })
    }
    setSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <div className="bg-white border-b border-border px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-primary">Cari Paket</Link>
          <span>/</span>
          <Link href={`/package/${pkg.slug}`} className="hover:text-primary truncate">{pkg.name}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Checkout</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {result?.success ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">Booking Berhasil!</h2>
            <p className="text-sm text-muted-foreground">Mengalihkan ke detail booking...</p>
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stepper */}
            <div className="bg-white border border-border rounded-2xl p-4 sm:p-5">
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
                {/* Package Summary */}
                <div className="bg-white border border-border rounded-2xl p-5">
                  <div className="flex gap-4">
                    <div className="relative w-24 h-20 rounded-xl overflow-hidden shrink-0">
                      <Image src={pkg.image_url || "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80"} alt={pkg.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{travel?.name}</p>
                      <h3 className="font-semibold text-sm leading-snug">{pkg.name}</h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        {pkg.duration_days && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pkg.duration_days} Hari</span>}
                        {pkg.airline && <span className="flex items-center gap-1"><Plane className="w-3 h-3" />{pkg.airline}</span>}
                      </div>
                    </div>
                    <p className="text-lg font-bold text-primary">{formatRupiah(pkg.price)}<span className="text-xs text-muted-foreground font-normal">/org</span></p>
                  </div>
                </div>

                {/* Pilgrim Count */}
                <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
                  <label className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Jumlah Jamaah</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPilgrimCount(Math.max(1, pilgrimCount - 1))} className="w-9 h-9 rounded-xl border border-border hover:bg-muted transition-colors font-bold text-lg">-</button>
                    <span className="w-12 text-center font-bold text-lg">{pilgrimCount}</span>
                    <button onClick={() => setPilgrimCount(Math.min(99, pilgrimCount + 1))} className="w-9 h-9 rounded-xl border border-border hover:bg-muted transition-colors font-bold text-lg">+</button>
                  </div>
                </div>

                {/* Pilgrim Details */}
                {pilgrims.map((pilgrim, idx) => (
                  <div key={idx} className="bg-white border border-border rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Jamaah {idx + 1}
                      </label>
                      {idx === 0 && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Utama</span>}
                    </div>

                    {savedParticipants.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {savedParticipants.map((sp) => (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() => fillFromSaved(idx, sp)}
                            className="text-xs px-2.5 py-1 rounded-full border border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            {sp.full_name}
                          </button>
                        ))}
                        <span className="text-[10px] text-muted-foreground self-center ml-1">pilih dari data tersimpan</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Nama Lengkap *</label>
                        <input
                          type="text"
                          value={pilgrim.full_name}
                          onChange={(e) => updatePilgrim(idx, "full_name", e.target.value)}
                          placeholder="Nama sesuai KTP/Paspor"
                          className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">NIK</label>
                        <input
                          type="text"
                          value={pilgrim.nik}
                          onChange={(e) => updatePilgrim(idx, "nik", e.target.value)}
                          placeholder="16 digit NIK"
                          maxLength={16}
                          className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">No. Paspor</label>
                        <input
                          type="text"
                          value={pilgrim.passport_no}
                          onChange={(e) => updatePilgrim(idx, "passport_no", e.target.value)}
                          placeholder="Nomor paspor"
                          className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Jenis Kelamin</label>
                        <select
                          value={pilgrim.gender}
                          onChange={(e) => updatePilgrim(idx, "gender", e.target.value)}
                          className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
                        >
                          <option value="">Pilih</option>
                          <option value="male">Laki-laki</option>
                          <option value="female">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">No. Telepon</label>
                        <input
                          type="tel"
                          value={pilgrim.phone}
                          onChange={(e) => updatePilgrim(idx, "phone", e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Hubungan</label>
                        <select
                          value={pilgrim.relation}
                          onChange={(e) => updatePilgrim(idx, "relation", e.target.value)}
                          className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
                        >
                          <option value="self">Diri Sendiri</option>
                          <option value="spouse">Suami/Istri</option>
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
                  <Button onClick={() => setStep(1)} disabled={!allPilgrimsFilled} className="gap-2">
                    Lanjut ke Pembayaran <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                {/* Payment Type */}
                <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
                  <label className="text-sm font-semibold">Tipe Pembayaran</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentType("full")}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${paymentType === "full" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-200"}`}
                    >
                      <CheckCircle className={`w-5 h-5 mb-1 ${paymentType === "full" ? "text-emerald-600" : "text-muted-foreground"}`} />
                      <p className="text-sm font-semibold">Bayar Lunas</p>
                      <p className="text-xs text-muted-foreground">Bayar penuh sekarang</p>
                    </button>
                    <button
                      onClick={() => setPaymentType("dp")}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${paymentType === "dp" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-200"}`}
                    >
                      <Sparkles className={`w-5 h-5 mb-1 ${paymentType === "dp" ? "text-emerald-600" : "text-muted-foreground"}`} />
                      <p className="text-sm font-semibold">DP (Cicil)</p>
                      <p className="text-xs text-muted-foreground">Bayar DP dulu, lunas nanti</p>
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
                            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
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
                  <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
                    <label className="text-sm font-semibold">Metode Pembayaran</label>
                    <button
                      onClick={() => setUseWallet(true)}
                      className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${useWallet ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-200"}`}
                    >
                      <Wallet className={`w-5 h-5 ${useWallet ? "text-emerald-600" : "text-muted-foreground"}`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Dompet UmrohQ</p>
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
                        <p className="text-sm font-semibold">Transfer Bank / QRIS</p>
                        <p className="text-xs text-muted-foreground">Bayar via Xendit (BCA, Mandiri, BRI, QRIS)</p>
                      </div>
                      <CheckCircle className={`w-4 h-4 ${!useWallet ? "text-emerald-600" : "text-muted-foreground/30"}`} />
                    </button>
                  </div>
                )}

                {/* Notes */}
                <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
                  <label className="text-sm font-semibold">Catatan (opsional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: request kursi dekat jendela, gabung dengan rombongan..."
                    rows={2}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(0)}>← Kembali</Button>
                  <Button onClick={() => setStep(2)} className="gap-2">
                    Lanjut ke Konfirmasi <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Fee Breakdown */}
                <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" /> Ringkasan Pembayaran
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Harga paket ({pilgrimCount} org x {formatRupiah(pkg.price)})</span>
                      <span className="font-medium">{formatRupiah(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Biaya layanan platform ({pilgrimCount} org x {formatRupiah(feeBreakdown.platformFeePerPerson)})</span>
                      <span className="font-medium">{formatRupiah(feeBreakdown.totalPlatformFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service fee ({feeBreakdown.serviceFee > totalPrice * 0.03 / 100 ? "minimal" : `${feeBreakdown.serviceFee}%`})</span>
                      <span className="font-medium">{formatRupiah(feeBreakdown.serviceFee)}</span>
                    </div>
                    <div className="border-t border-dashed border-border pt-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal (platform + service)</span>
                      <span className="font-medium">{formatRupiah(feeBreakdown.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PPN 11%</span>
                      <span className="font-medium">{formatRupiah(feeBreakdown.tax)}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">Total tagihan</span>
                      <span className="text-xl font-bold text-primary">{formatRupiah(totalPrice + feeBreakdown.total)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Total dibayar sekarang</span>
                      <span className="font-bold text-emerald-700">{formatRupiah(dpAmount + (paymentType === "full" ? feeBreakdown.total : 0))}</span>
                    </div>
                  </div>

                  {paymentType === "dp" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Pembayaran DP {dpPercentage}%</p>
                        <p className="text-amber-700 mt-0.5">Sisa {formatRupiah(remainingAmount)} dilunasi sesuai ketentuan travel.</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setUseWallet(!useWallet)}
                    className="text-xs text-primary hover:underline"
                  >
                    {useWallet ? "Ubah metode pembayaran" : "Gunakan dompet"}
                  </button>
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
                      className="gap-2"
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
