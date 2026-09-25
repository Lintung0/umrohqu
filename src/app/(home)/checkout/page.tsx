"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useMemo, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { enrichPackagesWithDetail } from "@/lib/package-detail-fields"
import { Loader2, CreditCard, Users, CheckCircle, AlertCircle, Shield, Sparkles, ChevronRight, ChevronDown, ChevronUp, User, Phone, Heart, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import { getPackageAvailable } from "@/lib/utils"
import type { Package, Tenant, PackageDeparture } from "@/lib/types"
import { SNAP_SCRIPT_URL, MIDTRANS_CLIENT_KEY, vtWebUrl } from "@/lib/services/midtrans-client"

const DP_OPTIONS = [30, 40, 50]

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const packageSlug = searchParams.get("slug")

  const [pkg, setPkg] = useState<Package | null>(null)
  const [travel, setTravel] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; bookingId?: string; error?: string } | null>(null)

  const [step, setStep] = useState(0)
  const [pilgrimCount, setPilgrimCount] = useState(1)
  const [pilgrims, setPilgrims] = useState<Array<{ full_name: string; phone: string; relation: string; gender: string }>>([])
  const [paymentType, setPaymentType] = useState<"full" | "dp">("full")
  const [dpPercentage, setDpPercentage] = useState(30)
  const [notes, setNotes] = useState("")
  const [expandedJemaah, setExpandedJemaah] = useState<Record<number, boolean>>({ 0: true })
  const [packageDepartures, setPackageDepartures] = useState<PackageDeparture[]>([])
  const [selectedDepartureId, setSelectedDepartureId] = useState<string | null>(null)

  const STEPS = useMemo(() => [
    { id: "package", label: "Data Singkat" },
    { id: "departure", label: "Keberangkatan" },
    { id: "payment", label: "Pembayaran" },
    { id: "confirm", label: "Selesai" },
  ], [])

  const supabase = useMemo(() => createClient(), [])

  // Fetch package data
  useEffect(() => {
    if (!packageSlug) {
      setLoading(false)
      setError("Parameter slug tidak ditemukan.")
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        const { data: pkgData, error: pkgError } = await supabase
          .from("packages")
          .select("*, travel:tenants(*), departures:package_departures(id, departure_city, departure_date, quota, price_adjustment)")
          .eq("slug", packageSlug)
          .single()

        if (cancelled) return

        if (pkgError || !pkgData) {
          setError("Paket tidak ditemukan.")
          setLoading(false)
          return
        }

        if (pkgData.status === "ongoing" || getPackageAvailable(pkgData as any) <= 0) {
          setError("Paket ini tidak bisa dipesan karena sedang berlangsung atau kursi sudah penuh.")
          setLoading(false)
          return
        }

        // Filter active departures with available quota
        const activeDepartures = (pkgData.departures || [])
          .filter((d: PackageDeparture) => d.quota > 0)
          .sort((a: PackageDeparture, b: PackageDeparture) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime())

        if (activeDepartures.length > 0) {
          setPackageDepartures(activeDepartures)
          // Auto-select first departure if only one
          if (activeDepartures.length === 1) {
            setSelectedDepartureId(activeDepartures[0].id)
          }
        }

        const enriched = await enrichPackagesWithDetail(supabase, [pkgData as any])
        setPkg((enriched?.[0] as any) || (pkgData as any))
        setTravel((pkgData as any).travel as Tenant || null)
        setLoading(false)
      } catch {
        if (!cancelled) {
          setError("Gagal memuat data paket.")
          setLoading(false)
        }
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [packageSlug, supabase])

  // Sync pilgrim array with pilgrimCount
  useEffect(() => {
    setPilgrims((prev) => {
      const next = [...prev]
      while (next.length < pilgrimCount) {
        next.push({ full_name: "", phone: "", relation: "self", gender: "" })
      }
      return next.slice(0, pilgrimCount)
    })
  }, [pilgrimCount])

  const totalPrice = useMemo(() => pkg ? Number(pkg.price) * pilgrimCount : 0, [pkg, pilgrimCount])
  const dpAmount = useMemo(() => paymentType === "dp" ? Math.round(totalPrice * dpPercentage / 100) : totalPrice, [paymentType, totalPrice, dpPercentage])
  const remainingAmount = useMemo(() => paymentType === "dp" ? totalPrice - dpAmount : 0, [paymentType, totalPrice, dpAmount])
  const amountToPayNow = useMemo(() => paymentType === "dp" ? dpAmount : totalPrice, [paymentType, dpAmount, totalPrice])

  const updatePilgrim = useCallback((index: number, field: string, value: string) => {
    setPilgrims((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }, [])

  const allPilgrimsFilled = useMemo(() => pilgrims.every((p) => p.full_name.trim().length > 0 && p.phone.trim().length > 0), [pilgrims])

  const toggleJemaah = useCallback((idx: number) => {
    setExpandedJemaah((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!pkg) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({
            packageId: pkg.id,
            packageDepartureId: selectedDepartureId,
            pilgrimCount,
            pilgrims: pilgrims.map((p) => ({
              full_name: p.full_name,
              phone: p.phone || null,
              gender: p.gender || null,
              relation: p.relation || "self",
            })),
            paymentType,
            dpPercentage: paymentType === "dp" ? dpPercentage : undefined,
            notes,
            feeChannel: "portal",
            referralCode: undefined,
          }),
      })
      const data = await res.json()
      if (res.ok && data.snap && data.booking_id) {
        // Gunakan Midtrans Snap JS SDK dengan callback onPending untuk capture VA number
        const snapToken = data.snap.token
        const bookingId = data.booking_id

        // Load Midtrans Snap JS SDK dynamically
        const loadSnapScript = (): Promise<void> => {
          return new Promise((resolve, reject) => {
            if (typeof window !== "undefined" && (window as any).snap) {
              resolve()
              return
            }
            const script = document.createElement("script")
            script.src = SNAP_SCRIPT_URL
            script.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY)
            script.onload = () => resolve()
            script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap JS"))
            document.body.appendChild(script)
          })
        }

        try {
          await loadSnapScript()

          // @ts-ignore - Midtrans Snap types
          window.snap.pay(snapToken, {
            onSuccess: async function (result: any) {
              console.log("Payment success:", result)
              router.push(`/checkout/finish?booking_id=${bookingId}`)
            },
            onPending: async function (result: any) {
              console.log("Payment pending:", result)
              // Capture VA number dari callback onPending
              const vaNumber = result.va_numbers?.[0]?.va_number
              const bank = result.va_numbers?.[0]?.bank
              if (vaNumber) {
                try {
                  await fetch("/api/payments/update-va", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bookingId, vaNumber, bank }),
                  })
                  console.log("VA number updated:", vaNumber, bank)
                } catch (e) {
                  console.error("Failed to update VA:", e)
                }
              }
              // Redirect ke finish page untuk verifikasi sebelum ke detail
              router.push(`/checkout/finish?booking_id=${bookingId}`)
            },
            onError: async function (result: any) {
              console.log("Payment error:", result)
              // Redirect ke finish page untuk cek status
              router.push(`/checkout/finish?booking_id=${bookingId}`)
            },
            onClose: function () {
              console.log("Payment popup closed")
              // Tutup popup, kembali ke checkout (bisa juga ke finish)
              router.push(`/checkout/finish?booking_id=${bookingId}`)
            },
          })
        } catch (snapError) {
          console.error("Snap JS error:", snapError)
          // Fallback ke redirect biasa jika Snap JS gagal
          window.location.href = data.snap.redirect_url || vtWebUrl(snapToken)
        }
      } else if (res.ok) {
        setResult({ success: true, bookingId: data.booking_id })
        setTimeout(() => router.push(`/dashboard/bookings/${data.booking_id}`), 2000)
      } else {
        setResult({ success: false, error: data.error })
      }
    } catch {
      setResult({ success: false, error: "Terjadi kesalahan jaringan. Silakan coba lagi." })
    }
    setSubmitting(false)
  }, [pkg, pilgrimCount, pilgrims, paymentType, dpPercentage, notes, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ivory-ink/70 animate-pulse">Memuat data checkout...</p>
        </div>
      </main>
    )
  }

  if (error || !pkg) {
    return (
      <main className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-emerald-deep">Terjadi Kesalahan</h2>
          <p className="text-sm text-ivory-ink/70">{error || "Paket tidak ditemukan. Silakan kembali ke katalog."}</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/search">
              <Button variant="outline" className="gap-2">
                ← Kembali ke Cari Paket
              </Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-ivory-50">
      {/* Breadcrumb */}
      <div className="bg-ivory-card border-b border-ivory-border px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-ivory-ink/70">
          <Link href="/" className="hover:text-emerald-dark">Beranda</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-emerald-dark">Cari Paket</Link>
          <span>/</span>
          <Link href={`/package/${pkg.slug}`} className="hover:text-emerald-dark truncate hidden sm:inline">{pkg.name}</Link>
          <span className="hidden sm:inline">/</span>
          <span className="text-emerald-deep font-medium">Pembayaran</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {result?.success ? (
          <div className="bg-ivory-card rounded-2xl border border-emerald-dark/25 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-dark/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-dark" />
            </div>
            <h2 className="text-xl font-bold text-emerald-deep">Pesan Berhasil!</h2>
            <p className="text-sm text-ivory-ink/70">Anda akan diarahkan ke halaman booking...</p>
            <Loader2 className="w-5 h-5 animate-spin text-emerald-dark mx-auto" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Stepper */}
            <div className="bg-ivory-card border border-ivory-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-center max-w-lg mx-auto">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        i < step ? "bg-emerald-dark text-ivory" :
                        i === step ? "bg-emerald-dark text-ivory ring-4 ring-gold/50 shadow-md shadow-emerald-deep/20" :
                        "bg-ivory text-ivory-ink/50 border border-ivory-border"
                      }`}>
                        {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${
                        i <= step ? "text-emerald-deep" : "text-ivory-ink/50"
                      }`}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-14 sm:w-20 h-[3px] mx-2 sm:mx-3 rounded-full transition-colors ${
                        i < step ? "bg-emerald-dark" : "bg-ivory-border"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {step === 0 && (
              <StepDataSingkat
                pkg={pkg}
                travel={travel}
                pilgrimCount={pilgrimCount}
                setPilgrimCount={setPilgrimCount}
                pilgrims={pilgrims}
                updatePilgrim={updatePilgrim}
                allPilgrimsFilled={allPilgrimsFilled}
                expandedJemaah={expandedJemaah}
                toggleJemaah={toggleJemaah}
                setStep={setStep}
              />
            )}

            {step === 1 && packageDepartures.length > 0 && (
              <StepDeparture
                pkg={pkg}
                travel={travel}
                packageDepartures={packageDepartures}
                selectedDepartureId={selectedDepartureId}
                setSelectedDepartureId={setSelectedDepartureId}
                setStep={setStep}
              />
            )}

            {step === (packageDepartures.length > 0 ? 2 : 1) && (
              <StepPayment
                pkg={pkg}
                travel={travel}
                pilgrimCount={pilgrimCount}
                totalPrice={totalPrice}
                dpAmount={dpAmount}
                remainingAmount={remainingAmount}
                dpPercentage={dpPercentage}
                setDpPercentage={setDpPercentage}
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                amountToPayNow={amountToPayNow}
                notes={notes}
                setNotes={setNotes}
                setStep={setStep}
                reviewStep={packageDepartures.length > 0 ? 3 : 2}
              />
            )}

            {step === (packageDepartures.length > 0 ? 3 : 2) && (
              <StepReview
                pkg={pkg}
                travel={travel}
                pilgrimCount={pilgrimCount}
                pilgrims={pilgrims}
                totalPrice={totalPrice}
                dpAmount={dpAmount}
                remainingAmount={remainingAmount}
                dpPercentage={dpPercentage}
                paymentType={paymentType}
                amountToPayNow={amountToPayNow}
                submitting={submitting}
                result={result}
                handleSubmit={handleSubmit}
                setStep={setStep}
              />
            )}
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Step 1: Data Singkat ────────────────────────────────────────────────────

function StepDataSingkat({
  pkg, travel, pilgrimCount, setPilgrimCount, pilgrims, updatePilgrim,
  allPilgrimsFilled, expandedJemaah, toggleJemaah, setStep,
}: {
  pkg: Package
  travel: Tenant | null
  pilgrimCount: number
  setPilgrimCount: (n: number) => void
  pilgrims: Array<{ full_name: string; phone: string; relation: string; gender: string }>
  updatePilgrim: (index: number, field: string, value: string) => void
  allPilgrimsFilled: boolean
  expandedJemaah: Record<number, boolean>
  toggleJemaah: (idx: number) => void
  setStep: (n: number) => void
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-5">
        

        <div className="bg-ivory-card border border-ivory-border rounded-2xl p-5 shadow-sm">
          <label className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-emerald-dark" /> Jumlah Jemaah
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPilgrimCount(Math.max(1, pilgrimCount - 1))}
              className="w-10 h-10 rounded-xl border border-ivory-border hover:bg-ivory transition-colors font-bold text-lg flex items-center justify-center cursor-pointer"
            >-</button>
            <span className="w-12 text-center font-bold text-xl">{pilgrimCount}</span>
            <button
              onClick={() => setPilgrimCount(Math.min(20, pilgrimCount + 1))}
              className="w-10 h-10 rounded-xl border border-ivory-border hover:bg-ivory transition-colors font-bold text-lg flex items-center justify-center cursor-pointer"
            >+</button>
            <span className="text-xs text-ivory-ink/70 ml-2">maks. 20 jemaah</span>
          </div>
        </div>

        {pilgrims.map((pilgrim, idx) => (
          <div key={idx} className="bg-ivory-card border border-ivory-border rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => toggleJemaah(idx)}
              className="w-full flex items-center justify-between p-4 hover:bg-ivory transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  idx === 0 ? "bg-emerald-dark/10 text-emerald-deep" : "bg-ivory text-ivory-ink/70 border border-ivory-border"
                }`}>
                  <span className="text-sm font-bold">{idx + 1}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-emerald-deep">
                    {pilgrim.full_name || `Jemaah ${idx + 1}`}
                  </p>
                  <p className="text-[11px] text-ivory-ink/70">
                    {idx === 0 ? "Jemaah Utama" : "Pendamping"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pilgrim.full_name && pilgrim.phone && (
                  <span className="text-[10px] text-emerald-dark bg-emerald-dark/10 px-2 py-0.5 rounded-full font-medium">
                    Lengkap
                  </span>
                )}
                {expandedJemaah[idx] ? (
                  <ChevronUp className="w-4 h-4 text-ivory-ink/70" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-ivory-ink/70" />
                )}
              </div>
            </button>

            {expandedJemaah[idx] && (
              <div className="px-5 pb-5 space-y-3 border-t border-ivory-border/60">
                <div className="pt-4" />

                <div>
                  <label className="text-xs font-medium text-ivory-ink/70 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={pilgrim.full_name}
                    onChange={(e) => updatePilgrim(idx, "full_name", e.target.value)}
                    placeholder="Masukkan nama lengkap sesuai KTP"
                    className="w-full border border-ivory-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-ivory-ink/70 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> No. Telepon / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={pilgrim.phone}
                    onChange={(e) => { const v = e.target.value.replace(/[^0-9+]/g, "").replace(/\+/g, (m, i) => i === 0 ? m : "").slice(0, 15); updatePilgrim(idx, "phone", v) }}
                    placeholder="08xxx"
                    maxLength={15}
                    className="w-full border border-ivory-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-ivory-ink/70 mb-2 block">Jenis Kelamin</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                      pilgrim.gender === "male"
                        ? "border-emerald-dark bg-emerald-dark/10 text-emerald-deep"
                        : "border-ivory-border hover:border-gold/60 text-ivory-ink/70"
                    }`}>
                      <input
                        type="radio"
                        name={`gender-${idx}`}
                        value="male"
                        checked={pilgrim.gender === "male"}
                        onChange={(e) => updatePilgrim(idx, "gender", e.target.value)}
                        className="sr-only"
                      />
                      <User className="w-4 h-4" /> Laki-laki
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                      pilgrim.gender === "female"
                        ? "border-emerald-dark bg-emerald-dark/10 text-emerald-deep"
                        : "border-ivory-border hover:border-gold/60 text-ivory-ink/70"
                    }`}>
                      <input
                        type="radio"
                        name={`gender-${idx}`}
                        value="female"
                        checked={pilgrim.gender === "female"}
                        onChange={(e) => updatePilgrim(idx, "gender", e.target.value)}
                        className="sr-only"
                      />
                      <User className="w-4 h-4" /> Perempuan
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ivory-ink/70 mb-1.5 flex items-center gap-1.5">
                    <Heart className="w-3 h-3" /> Hubungan
                  </label>
                  <select
                    value={pilgrim.relation}
                    onChange={(e) => updatePilgrim(idx, "relation", e.target.value)}
                    className="w-full border border-ivory-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-ivory-card transition-colors"
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

        <div className="lg:hidden flex justify-end">
          <Button onClick={() => setStep(1)} disabled={!allPilgrimsFilled} className="gap-2 px-6 h-12 w-full sm:w-auto">
            Lanjutkan <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="bg-ivory-card border border-ivory-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm text-emerald-deep mb-4">Ringkasan Pemesanan</h3>

            <div className="flex gap-3 pb-4 border-b border-ivory-border/60">
              <div className="relative w-16 h-14 rounded-xl overflow-hidden shrink-0">
                <Image src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"} alt={pkg.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-ivory-ink/70 truncate">{travel?.name}</p>
                <p className="text-sm font-semibold text-emerald-deep leading-snug line-clamp-2">{pkg.name}</p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ivory-ink/70">Harga per orang</span>
                <span className="font-medium text-emerald-deep">{formatRupiah(Number(pkg.price))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ivory-ink/70">Jumlah jemaah</span>
                <span className="font-medium text-emerald-deep">x{pilgrimCount}</span>
              </div>
            </div>

            <div className="bg-emerald-dark/10 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-deep font-medium">Total Pembayaran</span>
                <span className="text-lg font-bold text-emerald-deep">{formatRupiah(Number(pkg.price) * pilgrimCount)}</span>
              </div>
            </div>

            <Button
              onClick={() => setStep(1)}
              disabled={!allPilgrimsFilled}
              className="w-full h-12 gap-2 bg-emerald-dark hover:bg-emerald-deep text-ivory py-3 rounded-xl font-semibold shadow-md shadow-emerald-deep/20 active:scale-[0.98] transition-all"
            >
            Lanjutkan <ChevronRight className="w-4 h-4" />
            </Button>

            </div>
      </div>
    </div>
    </div>
  )
}

  // ─── Step Departure: Pilih Keberangkatan ──────────────────────────────────────
  function StepDeparture({
  pkg, travel, packageDepartures, selectedDepartureId, setSelectedDepartureId, setStep,
}: {
  pkg: Package
  travel: Tenant | null
  packageDepartures: PackageDeparture[]
  selectedDepartureId: string | null
  setSelectedDepartureId: (id: string) => void
  setStep: (n: number) => void
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-5">

        <div className="space-y-3">
          {packageDepartures.map((dep) => (
            <button
              key={dep.id}
              onClick={() => setSelectedDepartureId(dep.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selectedDepartureId === dep.id
                  ? "border-emerald-dark bg-emerald-dark/10"
                  : "border-ivory-border hover:border-gold/60 hover:bg-emerald-dark/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedDepartureId === dep.id
                      ? "bg-emerald-dark text-ivory"
                      : "bg-emerald-dark/10 text-emerald-deep"
                  }`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-deep">
                      {new Date(dep.departure_date).toLocaleDateString("id-ID", { 
                        weekday: "long", 
                        day: "numeric", 
                        month: "long", 
                        year: "numeric" 
                      })}
                    </p>
                    <p className="text-xs text-emerald-deep">Kota: {dep.departure_city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-deep">
                    Kuota: {dep.quota} kursi
                  </p>
                  {dep.price_adjustment && dep.price_adjustment > 0 && (
                    <p className="text-xs font-semibold text-emerald-deep">+{formatRupiah(dep.price_adjustment)}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {!selectedDepartureId && (
          <p className="text-center text-amber-600 text-sm py-2">
            Silakan pilih salah satu jadwal keberangkatan
          </p>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setStep(2)}
            disabled={!selectedDepartureId}
            className="px-6 py-2.5 rounded-xl bg-emerald-dark text-ivory font-semibold hover:bg-emerald-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lanjutkan <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="bg-ivory-card border border-ivory-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm text-emerald-deep mb-4">Ringkasan Paket</h3>
            <div className="flex gap-3 pb-4 border-b border-ivory-border/60">
              <div className="relative w-16 h-14 rounded-xl overflow-hidden shrink-0">
                <Image src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"} alt={pkg.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-ivory-ink/70 truncate">{travel?.name}</p>
                <p className="text-sm font-semibold text-emerald-deep leading-snug line-clamp-2">{pkg.name}</p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ivory-ink/70">Harga per orang</span>
                <span className="font-medium text-emerald-deep">{formatRupiah(Number(pkg.price))}</span>
              </div>
            </div>

            <div className="bg-emerald-dark/10 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-deep font-medium">Total Pembayaran</span>
                <span className="text-lg font-bold text-emerald-deep">{formatRupiah(Number(pkg.price))}</span>
              </div>
            </div>

            <p className="text-[10px] text-ivory-ink/70 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Harga sudah termasuk fasilitas paket umrah lengkap
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Payment ─────────────────────────────────────────────────────────

function StepPayment({
  pkg, travel, pilgrimCount, totalPrice, dpAmount, remainingAmount,
  dpPercentage, setDpPercentage, paymentType, setPaymentType,
  amountToPayNow, notes, setNotes, setStep, reviewStep,
}: {
  pkg: Package
  travel: Tenant | null
  pilgrimCount: number
  totalPrice: number
  dpAmount: number
  remainingAmount: number
  dpPercentage: number
  setDpPercentage: (n: number) => void
  paymentType: "full" | "dp"
  setPaymentType: (v: "full" | "dp") => void
  amountToPayNow: number
  notes: string
  setNotes: (v: string) => void
  setStep: (n: number) => void
  reviewStep: number
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-ivory-card border border-ivory-border rounded-2xl p-5 space-y-3 shadow-sm">
          <label className="text-sm font-semibold">Tipe Pembayaran</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentType("full")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${paymentType === "full" ? "border-emerald-dark bg-emerald-dark/10" : "border-ivory-border hover:border-gold/60"}`}
            >
              <CheckCircle className={`w-5 h-5 mb-1 ${paymentType === "full" ? "text-emerald-dark" : "text-ivory-ink/70"}`} />
              <p className="text-sm font-semibold">Bayar Full</p>
              <p className="text-xs text-ivory-ink/70">Bayar lunas sekarang</p>
            </button>
            <button
              onClick={() => setPaymentType("dp")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${paymentType === "dp" ? "border-emerald-dark bg-emerald-dark/10" : "border-ivory-border hover:border-gold/60"}`}
            >
              <Sparkles className={`w-5 h-5 mb-1 ${paymentType === "dp" ? "text-emerald-dark" : "text-ivory-ink/70"}`} />
              <p className="text-sm font-semibold">Bayar DP</p>
              <p className="text-xs text-ivory-ink/70">Bayar sebagian dulu</p>
            </button>
          </div>

          {paymentType === "dp" && (
            <div>
              <p className="text-xs text-ivory-ink/70 mb-2">Besaran DP</p>
              <div className="flex gap-2">
                {DP_OPTIONS.map((pct) => {
                  const dpNominal = Math.round(totalPrice * pct / 100)
                  return (
                    <button
                      key={pct}
                      onClick={() => setDpPercentage(pct)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                        dpPercentage === pct ? "border-emerald-dark bg-emerald-dark/10 text-emerald-deep" : "border-ivory-border hover:border-gold/60"
                      }`}
                    >
                      <span>{pct}%</span>
                      <span className="block text-[11px] font-normal text-ivory-ink/70 mt-0.5 whitespace-nowrap text-center overflow-hidden">{formatRupiah(dpNominal)}</span>
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

        <div className="bg-ivory-card border border-ivory-border rounded-2xl p-5 space-y-3 shadow-sm">
          <label className="text-sm font-semibold">Metode Pembayaran</label>
          <div className="w-full p-4 rounded-xl border-2 border-emerald-dark/25 bg-emerald-dark/5 text-left">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 mt-0.5 shrink-0 text-emerald-dark" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Pilih metode pembayaran</p>
                <p className="text-xs text-ivory-ink/70 mb-2">Transfer Bank / Virtual Account, Kartu Kredit, QRIS, E-Wallet</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {["BCA", "Mandiri", "BNI", "BRI", "Permata", "GoPay", "ShopeePay", "QRIS"].map((m) => (
                    <span key={m} className="px-2 py-1 bg-ivory-card border border-ivory-border rounded-md text-[10px] font-semibold text-ivory-ink/70">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-dark" />
            </div>
          </div>
        </div>

        <div className="bg-ivory-card border border-ivory-border rounded-2xl p-5 space-y-3 shadow-sm">
          <label className="text-sm font-semibold">Catatan (Opsional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan untuk travel..."
            rows={2}
            className="w-full border border-ivory-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
          />
        </div>

        <div className="lg:hidden flex justify-between">
          <Button variant="outline" onClick={() => setStep(0)}>← Kembali</Button>
          <Button onClick={() => setStep(reviewStep)} className="gap-2 px-6 h-12">Tinjau <ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="bg-ivory-card border border-ivory-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm text-emerald-deep mb-4">Ringkasan Pemesanan</h3>

            <div className="flex gap-3 pb-4 border-b border-ivory-border/60">
              <div className="relative w-16 h-14 rounded-xl overflow-hidden shrink-0">
                <Image src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"} alt={pkg.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-ivory-ink/70 truncate">{travel?.name}</p>
                <p className="text-sm font-semibold text-emerald-deep leading-snug line-clamp-2">{pkg.name}</p>
              </div>
            </div>

            <div className="py-4 space-y-2 text-sm border-b border-ivory-border/60">
              <div className="flex justify-between">
                <span className="text-ivory-ink/70">Harga per orang</span>
                <span className="font-medium">{formatRupiah(Number(pkg.price))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ivory-ink/70">Jumlah jemaah</span>
                <span className="font-medium">x{pilgrimCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ivory-ink/70">Subtotal paket</span>
                <span className="font-medium">{formatRupiah(totalPrice)}</span>
              </div>
              {paymentType === "dp" && (
                <>
                  <div className="flex justify-between text-emerald-deep">
                    <span className="font-medium">DP ({dpPercentage}%)</span>
                    <span className="font-semibold">{formatRupiah(dpAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-amber-600">
                    <span>Sisa pelunasan</span>
                    <span className="font-medium">{formatRupiah(remainingAmount)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-emerald-dark/10 rounded-xl p-4 mt-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-deep font-medium">Bayar sekarang</span>
                <span className="text-lg font-bold text-emerald-deep">{formatRupiah(amountToPayNow)}</span>
              </div>
            </div>

            {paymentType === "dp" && (
              <p className="text-[10px] text-amber-600 mb-3 flex items-start gap-1.5">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                Sisa pelunasan ({formatRupiah(remainingAmount)}) wajib dibayarkan maksimal H-30 keberangkatan.
              </p>
            )}

            <Button
              onClick={() => setStep(reviewStep)}
              className="w-full h-12 gap-2 bg-emerald-dark hover:bg-emerald-deep text-ivory py-3 rounded-xl font-semibold shadow-md shadow-emerald-deep/20 active:scale-[0.98] transition-all"
            >
              Proses Pembayaran <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Review ──────────────────────────────────────────────────────────

function StepReview({
  pkg, travel, pilgrimCount, pilgrims, totalPrice, dpAmount, remainingAmount,
  dpPercentage, paymentType, amountToPayNow,
  submitting, result, handleSubmit, setStep,
}: {
  pkg: Package
  travel: Tenant | null
  pilgrimCount: number
  pilgrims: Array<{ full_name: string; phone: string; relation: string; gender: string }>
  totalPrice: number
  dpAmount: number
  remainingAmount: number
  dpPercentage: number
  paymentType: "full" | "dp"
  amountToPayNow: number
  submitting: boolean
  result: { success: boolean; bookingId?: string; error?: string } | null
  handleSubmit: () => void
  setStep: (n: number) => void
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-ivory-card border border-ivory-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm mb-3">Data Jemaah</h3>
          <div className="space-y-2">
            {pilgrims.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-7 h-7 rounded-full bg-emerald-dark/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-emerald-deep">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.full_name}</p>
                  <p className="text-xs text-ivory-ink/70">{p.phone} · {p.gender === "male" ? "Laki-laki" : p.gender === "female" ? "Perempuan" : "-"} · {p.relation === "self" ? "Diri sendiri" : p.relation}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-ivory-ink/70 mt-3 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Data lengkap (NIK, alamat, KTP) dapat diisi setelah booking dibuat
          </p>
        </div>

        {result && !result.success && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {result.error}
          </div>
        )}

        <div className="lg:hidden flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>← Kembali</Button>
          <div className="flex gap-2">
            <Link href={`/package/${pkg.slug}`}>
              <Button variant="ghost" size="sm" className="text-xs">Batal</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2 px-6 h-12">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : "Bayar"}
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="bg-ivory-card border border-ivory-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm text-emerald-deep mb-4">Ringkasan Pemesanan</h3>

            <div className="flex gap-3 pb-4 border-b border-ivory-border/60">
              <div className="relative w-16 h-14 rounded-xl overflow-hidden shrink-0">
                <Image src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"} alt={pkg.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-ivory-ink/70 truncate">{travel?.name}</p>
                <p className="text-sm font-semibold text-emerald-deep leading-snug line-clamp-2">{pkg.name}</p>
              </div>
            </div>

            <div className="py-4 space-y-2 text-sm border-b border-ivory-border/60">
              <div className="flex justify-between">
                <span className="text-ivory-ink/70">Harga per orang</span>
                <span className="font-medium">{formatRupiah(Number(pkg.price))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ivory-ink/70">Jumlah jemaah</span>
                <span className="font-medium">x{pilgrimCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ivory-ink/70">Subtotal paket</span>
                <span className="font-medium">{formatRupiah(totalPrice)}</span>
              </div>
              {paymentType === "dp" && (
                <>
                  <div className="flex justify-between text-emerald-deep">
                    <span className="font-medium">DP ({dpPercentage}%)</span>
                    <span className="font-semibold">{formatRupiah(dpAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-amber-600">
                    <span>Sisa pelunasan</span>
                    <span className="font-medium">{formatRupiah(remainingAmount)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-emerald-dark/10 rounded-xl p-4 mt-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-deep font-medium">Bayar sekarang</span>
                <span className="text-lg font-bold text-emerald-deep">{formatRupiah(amountToPayNow)}</span>
              </div>
            </div>

            {paymentType === "dp" && (
              <p className="text-[10px] text-amber-600 mb-3 flex items-start gap-1.5">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                Sisa pelunasan ({formatRupiah(remainingAmount)}) wajib dibayarkan maksimal H-30 keberangkatan.
              </p>
            )}

            <div className="hidden lg:block">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 gap-2 bg-emerald-dark hover:bg-emerald-deep text-ivory py-3 rounded-xl font-semibold shadow-md shadow-emerald-deep/20 active:scale-[0.98] transition-all"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                ) : (
                  <>Bayar <ChevronRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <Link href={`/package/${pkg.slug}`}>
              <Button variant="ghost" size="sm" className="text-xs text-ivory-ink/70">Batal</Button>
            </Link>
            <span className="text-ivory-border">|</span>
            <Button variant="ghost" size="sm" className="text-xs text-ivory-ink/70" onClick={() => setStep(1)}>← Kembali</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page Export ─────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-ivory-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-ivory-ink/70 animate-pulse">Memuat checkout...</p>
          </div>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
