"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { enrichPackagesWithDetail } from "@/lib/package-detail-fields"
import { Loader2, CheckCircle, AlertCircle, ChevronRight, ChevronDown, ChevronUp, User, CalendarRange, Wallet, Landmark, Banknote, Upload, Copy, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import { getPackageAvailable } from "@/lib/utils"
import type { Package, Tenant } from "@/lib/types"

const DP_OPTIONS = [20, 30, 40, 50]

type Bank = {
  id: string
  bank_code: string
  bank_name: string
  account_number: string
  account_holder_name: string
  is_primary: boolean
}

type CreatedOrder = {
  bookingId: string
  paymentType: "installment" | "full"
  method: "transfer" | "cash"
  amount: number
  dpAmount: number
  remaining: number
  tenor: number
  bank: Bank | null
}

// Single source of truth untuk peringatan pelunasan DP H-30
function DpReminder({ amount, className }: { amount: number; className?: string }) {
  return (
    <p className={`flex items-start gap-1.5 text-amber-600 ${className || ""}`}>
      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
      Sisa pelunasan ({formatRupiah(amount)}) wajib dibayarkan maksimal H-30 keberangkatan.
    </p>
  )
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const packageSlug = searchParams.get("slug")

  const [pkg, setPkg] = useState<Package | null>(null)
  const [travel, setTravel] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [result, setResult] = useState<{ success: boolean; bookingId?: string; error?: string } | null>(null)

  const [step, setStep] = useState(0)
  const [pilgrimCount, setPilgrimCount] = useState(1)
  const [pilgrims, setPilgrims] = useState<Array<{ full_name: string; phone: string; relation: string; gender: string }>>([])
  // Default metode pembayaran adalah cicilan
  const [paymentType, setPaymentType] = useState<"installment" | "full">("installment")
  const [tenorMonths, setTenorMonths] = useState<number>(24)
  const [dpAmount, setDpAmount] = useState<number>(0)
  const [installmentOptions, setInstallmentOptions] = useState<any[]>([])
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "cash">("transfer")
  const [banks, setBanks] = useState<Bank[]>([])
  const [banksLoading, setBanksLoading] = useState(true)
  const [bankId, setBankId] = useState<string | null>(null)
  const [expandedTransfer, setExpandedTransfer] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null)
  const [expandedJemaah, setExpandedJemaah] = useState<Record<number, boolean>>({ 0: true })

  const allPilgrimsFilled = pilgrims.every((p) => p.full_name.trim().length > 0 && p.phone.trim().length > 0)

  const STEPS = useMemo(() => [
    { id: "package", label: "Data Jemaah" },
    { id: "payment", label: "Pembayaran" },
    { id: "confirm", label: "Instruksi" },
  ], [])

  const canGoTo = (i: number) => {
    if (i <= step) return true
    if (i === 1) return allPilgrimsFilled
    if (i === 2) return !!createdOrder
    return false
  }
  const goToStep = (i: number) => { if (canGoTo(i)) setStep(i) }

  const supabase = useMemo(() => createClient(), [])

  // Fetch package data & opsi cicilan
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
          .select("*, travel:tenants(*)")
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

        const enriched = await enrichPackagesWithDetail(supabase, [pkgData as any])
        setPkg((enriched?.[0] as any) || (pkgData as any))
        setTravel((pkgData as any).travel as Tenant || null)

        // Ambil opsi cicilan paket dari database
        const { data: optData } = await supabase
          .from("package_installment_options")
          .select("*")
          .eq("package_id", pkgData.id)
          .eq("is_active", true)
          .order("tenor_months", { ascending: true })

        if (!cancelled && optData && optData.length > 0) {
          setInstallmentOptions(optData)
          setTenorMonths(optData[0].tenor_months)
          setSelectedOptionId(optData[0].id)
        }

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
        next.push({ full_name: "", phone: "", relation: "self", gender: "male" })
      }
      return next.slice(0, pilgrimCount)
    })
  }, [pilgrimCount])

  const totalPrice = useMemo(() => pkg ? Number(pkg.price) * pilgrimCount : 0, [pkg, pilgrimCount])
  const isInstallment = paymentType === "installment"
  const selectedOption = installmentOptions.find((o) => o.id === selectedOptionId)
  const minDpPercent = Math.max(10, Number(selectedOption?.min_down_payment_percent || 0) || 10)
  const minDpAmount = Math.ceil((totalPrice * minDpPercent) / 100)
  const remainingAmount = useMemo(() => isInstallment ? Math.max(0, totalPrice - dpAmount) : 0, [isInstallment, totalPrice, dpAmount])
  const monthlyAmount = useMemo(() => {
    if (!isInstallment || tenorMonths <= 0) return 0
    return Math.round(remainingAmount / tenorMonths)
  }, [isInstallment, remainingAmount, tenorMonths])
  const amountToPayNow = isInstallment ? dpAmount : totalPrice
  const dpPercentDisplay = totalPrice > 0 ? Math.round((dpAmount / totalPrice) * 1000) / 10 : 0
  const methodLabel = paymentMethod === "cash" ? "Tunai di travel" : "Transfer bank"

  useEffect(() => {
    if (!pkg?.tenant_id) return
    let cancelled = false
    setBanksLoading(true)
    ;(async () => {
      const { data } = await supabase
        .from("banks")
        .select("id, bank_code, bank_name, account_number, account_holder_name, is_primary")
        .eq("tenant_id", pkg.tenant_id)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("bank_name", { ascending: true })
      if (cancelled) return
      const rows = (data || []) as Bank[]
      setBanks(rows)
      setBankId((prev) => prev && rows.some((b) => b.id === prev) ? prev : (rows.find((b) => b.is_primary)?.id || rows[0]?.id || null))
      setBanksLoading(false)
    })()
    return () => { cancelled = true }
  }, [pkg?.tenant_id, supabase])

  useEffect(() => {
    if (!isInstallment) return
    setDpAmount((prev) => {
      if (!prev || prev < minDpAmount || prev >= totalPrice) return minDpAmount
      return prev
    })
  }, [isInstallment, minDpAmount, totalPrice])

  const updatePilgrim = useCallback((index: number, field: string, value: string) => {
    setPilgrims((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }, [])

  const toggleJemaah = useCallback((idx: number) => {
    setExpandedJemaah((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!pkg) return
    // Guard anti double-klik: state saja tidak cukup (2 klik dalam 1 tick
    // lolos sebelum re-render). Ref sinkron, tidak bisa ditembus.
    if (submittingRef.current) return
    if (paymentMethod === "transfer" && !bankId) {
      setResult({ success: false, error: "Pilih rekening bank tujuan transfer." })
      return
    }
    if (isInstallment && dpAmount < minDpAmount) {
      setResult({ success: false, error: `Uang muka minimal ${formatRupiah(minDpAmount)}.` })
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    setResult(null)
    const done = () => {
      submittingRef.current = false
      setSubmitting(false)
    }
    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          packageDepartureId: null,
          pilgrimCount,
          pilgrims: pilgrims.map((p) => ({
            full_name: p.full_name,
            phone: p.phone || null,
            gender: p.gender || null,
            relation: p.relation || "self",
          })),
          paymentType,
          paymentMethod,
          bankId: paymentMethod === "transfer" ? bankId : undefined,
          dpAmount: isInstallment ? dpAmount : undefined,
          tenorMonths: isInstallment ? tenorMonths : undefined,
          installmentOptionId: isInstallment ? (selectedOptionId || undefined) : undefined,
          notes,
          feeChannel: "portal",
          referralCode: undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.booking_id) {
        setResult({ success: false, error: data.error || "Gagal membuat pesanan." })
        done()
        return
      }

      const selectedBank = banks.find((b) => b.id === bankId) || null
      setCreatedOrder({
        bookingId: data.booking_id,
        paymentType: data.payment_type === "full" ? "full" : "installment",
        method: paymentMethod,
        amount: Number(data.payment?.amount ?? data.dp_amount ?? amountToPayNow),
        dpAmount: Number(data.dp_amount ?? dpAmount),
        remaining: Number(data.remaining ?? remainingAmount),
        tenor: tenorMonths,
        bank: (data.payment?.bank as Bank | undefined) || selectedBank,
      })
      setStep(2)
      done()
    } catch {
      setResult({ success: false, error: "Terjadi kesalahan jaringan. Silakan coba lagi." })
      done()
    }
  }, [pkg, pilgrimCount, pilgrims, paymentType, paymentMethod, bankId, isInstallment, dpAmount, minDpAmount, tenorMonths, selectedOptionId, notes, amountToPayNow, remainingAmount, banks])

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
            <Link href="/packages">
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
          <Link href="/packages" className="hover:text-emerald-dark">Cari Paket</Link>
          <span>/</span>
          <Link href={`/packages/${pkg.slug}`} className="hover:text-emerald-dark truncate hidden sm:inline">{pkg.name}</Link>
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
            <div className="bg-ivory-card border border-ivory-border rounded-2xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-start justify-center max-w-lg mx-auto">
                {STEPS.map((s, i) => {
                  const allowed = canGoTo(i)
                  return (
                    <div key={s.id} className="flex items-start">
                      <button
                        type="button"
                        onClick={() => goToStep(i)}
                        disabled={!allowed}
                        aria-label={`Ke langkah ${s.label}`}
                        className={`flex flex-col items-center min-h-[44px] min-w-[44px] px-0.5 ${allowed ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                      >
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          i < step ? "bg-emerald-dark text-ivory" :
                          i === step ? "bg-emerald-dark text-ivory ring-4 ring-gold/50 shadow-md shadow-emerald-deep/20" :
                          "bg-ivory text-ivory-ink/50 border border-ivory-border"
                        }`}>
                          {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-[10px] sm:text-[11px] font-semibold mt-1 whitespace-nowrap ${
                          i <= step ? "text-emerald-deep" : "text-ivory-ink/50"
                        }`}>{s.label}</span>
                      </button>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 min-w-3 sm:min-w-0 sm:w-20 h-[3px] mx-1 sm:mx-3 mt-4 sm:mt-[18px] rounded-full transition-colors ${
                          i < step ? "bg-emerald-dark" : "bg-ivory-border"
                        }`} />
                      )}
                    </div>
                  )
                })}
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

            {step === 1 && (
              <StepPayment
                pkg={pkg}
                travel={travel}
                pilgrimCount={pilgrimCount}
                totalPrice={totalPrice}
                dpAmount={dpAmount}
                setDpAmount={setDpAmount}
                minDpAmount={minDpAmount}
                minDpPercent={minDpPercent}
                dpPercentDisplay={dpPercentDisplay}
                remainingAmount={remainingAmount}
                monthlyAmount={monthlyAmount}
                tenorMonths={tenorMonths}
                setTenorMonths={setTenorMonths}
                installmentOptions={installmentOptions}
                setSelectedOptionId={setSelectedOptionId}
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                banks={banks}
                banksLoading={banksLoading}
                bankId={bankId}
                setBankId={setBankId}
                expandedTransfer={expandedTransfer}
                setExpandedTransfer={setExpandedTransfer}
                amountToPayNow={amountToPayNow}
                methodLabel={methodLabel}
                notes={notes}
                setNotes={setNotes}
                setStep={setStep}
                submitting={submitting}
                result={result}
                handleSubmit={handleSubmit}
              />
            )}

            {step === 2 && createdOrder && (
              <StepInstructions order={createdOrder} travel={travel} />
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
  const [userProfile, setUserProfile] = useState<{ full_name: string; phone: string } | null>(null)
  const [useMyData, setUseMyData] = useState<Record<number, boolean>>({})

  useEffect(() => {
    let cancelled = false
    async function fetchProfile() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return
        const { data } = await supabase
          .from("users")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle()
        if (cancelled) return
        const fullName = (data as { full_name?: string; phone?: string } | null)?.full_name
          || (user.user_metadata as { full_name?: string; name?: string } | null)?.full_name
          || (user.user_metadata as { full_name?: string; name?: string } | null)?.name
          || ""
        const phone = (data as { full_name?: string; phone?: string } | null)?.phone
          || (user.user_metadata as { phone?: string } | null)?.phone
          || (user as { phone?: string })?.phone
          || ""
        setUserProfile({ full_name: fullName || "", phone: phone || "" })
      } catch {
        // silent
      }
    }
    fetchProfile()
    return () => { cancelled = true }
  }, [])

  const handleUseMyData = (idx: number, checked: boolean) => {
    setUseMyData((prev) => ({ ...prev, [idx]: checked }))
    if (checked && userProfile) {
      if (userProfile.full_name) updatePilgrim(idx, "full_name", userProfile.full_name)
      if (userProfile.phone) updatePilgrim(idx, "phone", userProfile.phone)
    } else if (!checked) {
      updatePilgrim(idx, "full_name", "")
      updatePilgrim(idx, "phone", "")
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-5">
        

        <div className="bg-ivory-card border border-ivory-border rounded-2xl p-5 shadow-sm">
          <label className="text-sm font-semibold mb-3 block">
            Jml. Jemaah
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
              <div className="px-5 pb-5 space-y-5 border-t border-ivory-border/60">
                <div className="pt-4" />

                <div>
                  {idx === 0 && (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!useMyData[idx]}
                      onClick={() => handleUseMyData(idx, !useMyData[idx])}
                      className={`w-full flex items-center gap-3 mb-5 p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        useMyData[idx]
                          ? "border-emerald-dark/40 bg-emerald-dark/5"
                          : "border-ivory-border bg-ivory hover:border-gold/50"
                      }`}
                    >
                      <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        useMyData[idx] ? "bg-emerald-dark" : "bg-ivory-border"
                      }`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-ivory-card shadow transition-transform ${
                          useMyData[idx] ? "translate-x-[22px]" : "translate-x-0.5"
                        }`} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-emerald-deep">Pesanan Pribadi</span>
                        <span className="block text-xs text-ivory-ink/60">Isi otomatis dengan nama & nomor Anda</span>
                      </span>
                    </button>
                  )}
                  <label className="text-base font-medium text-ivory-ink/70 mb-1.5 block">
                    Nama Lengkap *
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
                  <label className="text-base font-medium text-ivory-ink/70 mb-1.5 block">
                    No. Telepon / WhatsApp *
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
                  <label className="text-base font-medium text-ivory-ink/70 mb-2 block">Jenis Kelamin</label>
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
                  <label className="text-base font-medium text-ivory-ink/70 mb-1.5 block">
                    Hubungan
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
            <h3 className="font-bold text-sm text-emerald-deep mb-4">Ringkasan Pesanan</h3>

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
                <span className="text-ivory-ink/70">Harga</span>
                <span className="font-medium text-emerald-deep">{formatRupiah(Number(pkg.price))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ivory-ink/70">Jml. Jemaah</span>
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

// ─── Step 2: Payment ─────────────────────────────────────────────────────────

// ─── Step 2: Payment ─────────────────────────────────────────────────────────

function StepPayment({
  pkg, travel, pilgrimCount, totalPrice, dpAmount, setDpAmount,
  minDpAmount, minDpPercent, dpPercentDisplay, remainingAmount, monthlyAmount,
  tenorMonths, setTenorMonths, installmentOptions, setSelectedOptionId,
  paymentType, setPaymentType, paymentMethod, setPaymentMethod,
  banks, banksLoading, bankId, setBankId, expandedTransfer, setExpandedTransfer,
  amountToPayNow, methodLabel, notes, setNotes, setStep, submitting, result, handleSubmit,
}: {
  pkg: Package
  travel: Tenant | null
  pilgrimCount: number
  totalPrice: number
  dpAmount: number
  setDpAmount: (n: number) => void
  minDpAmount: number
  minDpPercent: number
  dpPercentDisplay: number
  remainingAmount: number
  monthlyAmount: number
  tenorMonths: number
  setTenorMonths: (n: number) => void
  installmentOptions: Array<{ id: string; tenor_months: number }>
  setSelectedOptionId: (id: string | null) => void
  paymentType: "installment" | "full"
  setPaymentType: (v: "installment" | "full") => void
  paymentMethod: "transfer" | "cash"
  setPaymentMethod: (v: "transfer" | "cash") => void
  banks: Bank[]
  banksLoading: boolean
  bankId: string | null
  setBankId: (id: string) => void
  expandedTransfer: boolean
  setExpandedTransfer: (v: boolean) => void
  amountToPayNow: number
  methodLabel: string
  notes: string
  setNotes: (v: string) => void
  setStep: (n: number) => void
  submitting: boolean
  result: { success: boolean; bookingId?: string; error?: string } | null
  handleSubmit: () => void
}) {
  const isInstallment = paymentType === "installment"
  const availableTenors = installmentOptions.length > 0
    ? [...new Set(installmentOptions.map((o) => o.tenor_months))]
    : [12, 24, 36]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Tipe pembayaran: bobot lewat kontras warna, tanpa nominal */}
        <section>
          <h3 className="text-sm font-semibold text-emerald-deep mb-3">Tipe Pembayaran</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { key: "installment" as const, label: "Cicilan", hint: "Uang muka dulu, sisanya dicicil tiap bulan", Icon: CalendarRange },
              { key: "full" as const, label: "Bayar Penuh", hint: "Satu kali bayar lunas, tanpa cicilan", Icon: Wallet },
            ]).map((opt) => {
              const active = paymentType === opt.key
              const Icon = opt.Icon
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPaymentType(opt.key)}
                  aria-pressed={active}
                  className={`relative text-left rounded-2xl p-5 border transition-all cursor-pointer min-h-[104px] ${
                    active
                      ? "border-emerald-dark bg-emerald-dark text-ivory"
                      : "border-ivory-border bg-ivory-card hover:border-gold/60"
                  }`}
                >
                  {active && <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-gold-light" />}
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${active ? "text-gold-light" : "text-emerald-dark"}`} />
                    <span className={`text-base font-bold ${active ? "text-ivory" : "text-emerald-deep"}`}>{opt.label}</span>
                  </div>
                  <span className={`block text-xs leading-relaxed ${active ? "text-ivory/70" : "text-ivory-ink/55"}`}>{opt.hint}</span>
                </button>
              )
            })}
          </div>
        </section>

        {isInstallment && (
          <>
            {/* Uang muka: input bebas dengan batas minimum */}
            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-semibold text-emerald-deep">Uang Muka</h3>
                <span className="text-[11px] text-ivory-ink/55">
                  Minimal {minDpPercent}% · {formatRupiah(minDpAmount)}
                </span>
              </div>
              <div className="rounded-xl border border-ivory-border bg-ivory-card p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ivory-ink/60">Rp</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={minDpAmount}
                    step={100000}
                    value={dpAmount || ""}
                    onChange={(e) => setDpAmount(Math.max(0, Number(e.target.value)))}
                    onBlur={() => { if (dpAmount < minDpAmount) setDpAmount(minDpAmount) }}
                    className="flex-1 min-w-0 bg-transparent text-2xl font-bold text-emerald-deep tabular-nums focus:outline-none"
                    aria-label="Nominal uang muka"
                  />
                  <span className="shrink-0 rounded-full bg-emerald-dark/10 px-2.5 py-1 text-xs font-bold text-emerald-deep tabular-nums">
                    {dpPercentDisplay}%
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-ivory overflow-hidden mt-3">
                  <div
                    className="h-full rounded-full bg-emerald-dark transition-all"
                    style={{ width: `${Math.min(100, dpPercentDisplay)}%` }}
                  />
                </div>

                <div className="flex gap-2 mt-3">
                  {DP_OPTIONS.filter((pct) => pct >= minDpPercent).map((pct) => {
                    const active = dpPercentDisplay === pct
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDpAmount(Math.ceil((totalPrice * pct) / 100))}
                        aria-pressed={active}
                        className={`flex-1 px-2 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer min-h-[44px] ${
                          active
                            ? "border-emerald-dark bg-emerald-dark text-ivory"
                            : "border-ivory-border text-ivory-ink/70 hover:border-gold/60"
                        }`}
                      >
                        {pct}%
                      </button>
                    )
                  })}
                </div>

                <p className="text-xs text-ivory-ink/55 mt-3">
                  Sisa <span className="font-semibold text-emerald-deep tabular-nums">{formatRupiah(remainingAmount)}</span> dicicil {tenorMonths} bulan.
                </p>
              </div>
            </section>

            {/* Tenor: deret kartu yang mudah dipindai */}
            <section>
              <h3 className="text-sm font-semibold text-emerald-deep mb-3">Tenor Cicilan</h3>
              <div className="grid grid-cols-3 gap-3">
                {availableTenors.map((t) => {
                  const matchedOption = installmentOptions.find((o) => o.tenor_months === t)
                  const simMonthly = Math.round(remainingAmount / t)
                  const active = tenorMonths === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTenorMonths(t)
                        setSelectedOptionId(matchedOption?.id || null)
                      }}
                      aria-pressed={active}
                      className={`relative text-left rounded-xl p-3.5 border transition-all cursor-pointer min-h-[72px] ${
                        active
                          ? "border-emerald-dark bg-emerald-dark/10 ring-1 ring-emerald-dark/30"
                          : "border-ivory-border bg-ivory-card hover:border-gold/60"
                      }`}
                    >
                      {active && <CheckCircle className="absolute top-2.5 right-2.5 w-4 h-4 text-emerald-dark" />}
                      <span className={`block text-lg font-bold ${active ? "text-emerald-deep" : "text-ivory-ink/80"}`}>
                        {t} bulan
                      </span>
                      <span className="block text-xs text-ivory-ink/55 mt-0.5 tabular-nums">{formatRupiah(simMonthly)}/bln</span>
                    </button>
                  )
                })}
              </div>
            </section>
          </>
        )}

        {/* Metode: Tunai atau Transfer manual */}
        <section>
          <h3 className="text-sm font-semibold text-emerald-deep mb-1">Metode Pembayaran</h3>
          <p className="text-xs text-ivory-ink/60 mb-3">Pilih cara kamu membayar. Instruksi lengkap muncul setelah pesanan dibuat.</p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              aria-pressed={paymentMethod === "cash"}
              className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                paymentMethod === "cash"
                  ? "border-emerald-dark bg-emerald-dark/5 ring-1 ring-emerald-dark/25"
                  : "border-ivory-border bg-ivory-card hover:border-gold/60"
              }`}
            >
              <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                paymentMethod === "cash" ? "bg-emerald-dark border-emerald-dark" : "border-ivory-ink/25"
              }`}>
                {paymentMethod === "cash" && <CheckCircle className="w-4 h-4 text-ivory" />}
              </span>
              <Banknote className="w-5 h-5 text-emerald-dark shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-emerald-deep">Tunai</span>
                <span className="block text-xs text-ivory-ink/55">Bayar langsung di kantor travel</span>
              </span>
            </button>

            <div className={`rounded-xl border transition-all ${
              paymentMethod === "transfer"
                ? "border-emerald-dark bg-ivory-card ring-1 ring-emerald-dark/25"
                : "border-ivory-border bg-ivory-card hover:border-gold/60"
            }`}>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("transfer")
                  setExpandedTransfer(true)
                }}
                aria-pressed={paymentMethod === "transfer"}
                aria-expanded={expandedTransfer && paymentMethod === "transfer"}
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
              >
                <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                  paymentMethod === "transfer" ? "bg-emerald-dark border-emerald-dark" : "border-ivory-ink/25"
                }`}>
                  {paymentMethod === "transfer" && <CheckCircle className="w-4 h-4 text-ivory" />}
                </span>
                <Landmark className="w-5 h-5 text-emerald-dark shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-emerald-deep">Transfer Bank</span>
                  <span className="block text-xs text-ivory-ink/55">Transfer ke rekening travel, lalu unggah bukti</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-ivory-ink/50 transition-transform ${
                    expandedTransfer && paymentMethod === "transfer" ? "rotate-180" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (paymentMethod !== "transfer") {
                      setPaymentMethod("transfer")
                      setExpandedTransfer(true)
                    } else {
                      setExpandedTransfer(!expandedTransfer)
                    }
                  }}
                />
              </button>

              {paymentMethod === "transfer" && expandedTransfer && (
                <div className="px-4 pb-4 space-y-2">
                  {banksLoading ? (
                    <p className="flex items-center gap-2 text-xs text-ivory-ink/55 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat rekening travel...
                    </p>
                  ) : banks.length === 0 ? (
                    <p className="rounded-lg bg-ivory border border-ivory-border p-3 text-xs text-ivory-ink/60">
                      Travel belum menambahkan rekening bank. Pilih tunai atau hubungi travel.
                    </p>
                  ) : (
                    banks.map((b) => {
                      const active = bankId === b.id
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBankId(b.id)}
                          aria-pressed={active}
                          className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                            active
                              ? "border-emerald-dark bg-emerald-dark/5"
                              : "border-ivory-border bg-ivory hover:border-gold/60"
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-emerald-dark/10 flex items-center justify-center shrink-0">
                            <Landmark className="w-4 h-4 text-emerald-dark" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-emerald-deep truncate">
                              {b.bank_name}
                              {b.is_primary && <span className="ml-1.5 text-[10px] font-bold uppercase text-gold-dark">Utama</span>}
                            </p>
                            <p className="text-xs text-ivory-ink/60 tabular-nums truncate">
                              {b.account_number} · {b.account_holder_name}
                            </p>
                          </div>
                          <span className={`w-4 h-4 rounded-full border shrink-0 ${
                            active ? "border-4 border-emerald-dark" : "border-ivory-ink/25"
                          }`} />
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <label htmlFor="checkout-notes" className="text-sm font-semibold text-emerald-deep block mb-2">
            Catatan untuk travel <span className="font-normal text-ivory-ink/50">(opsional)</span>
          </label>
          <textarea
            id="checkout-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Misalnya: permintaan kamar, kebutuhan khusus jemaah."
            rows={2}
            className="w-full bg-ivory-card border border-ivory-border rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
          />
        </section>

        {result && !result.success && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {result.error}
          </div>
        )}

        <div className="lg:hidden flex justify-between pt-1">
          <Button variant="outline" onClick={() => setStep(0)}>Kembali</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 h-12 bg-emerald-dark hover:bg-emerald-deep text-ivory"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : "Lanjutkan"}
          </Button>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-24">
          <div className="bg-ivory-card border border-ivory-border rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-emerald-deep mb-4">Ringkasan Pesanan</h3>

            <div className="flex gap-3 pb-4 border-b border-ivory-border">
              <div className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0">
                <Image src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"} alt={pkg.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-ivory-ink/60 truncate">{travel?.name}</p>
                <p className="text-sm font-semibold text-emerald-deep leading-snug line-clamp-2">{pkg.name}</p>
              </div>
            </div>

            <div className="py-4 space-y-2 text-sm border-b border-ivory-border">
              <div className="flex justify-between">
                <span className="text-ivory-ink/60">Harga paket</span>
                <span className="tabular-nums">{formatRupiah(Number(pkg.price))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ivory-ink/60">Jumlah jemaah</span>
                <span className="tabular-nums">x{pilgrimCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ivory-ink/60">Total biaya</span>
                <span className="tabular-nums">{formatRupiah(totalPrice)}</span>
              </div>
              {isInstallment && (
                <>
                  <div className="flex justify-between pt-1">
                    <span className="text-ivory-ink/60">Uang muka ({dpPercentDisplay}%)</span>
                    <span className="tabular-nums">{formatRupiah(dpAmount)}</span>
                  </div>
                  <div className="flex justify-between text-ivory-ink/50 text-xs">
                    <span>Sisa dicicil ({tenorMonths} bulan)</span>
                    <span className="tabular-nums">{formatRupiah(remainingAmount)}</span>
                  </div>
                  <div className="flex justify-between text-ivory-ink/50 text-xs">
                    <span>Cicilan / bulan</span>
                    <span className="tabular-nums">{formatRupiah(monthlyAmount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-ivory-ink/60">Metode</span>
                <span className="font-medium">{methodLabel}</span>
              </div>
            </div>

            {/* Kartu total: focal point */}
            <div className="mt-4 rounded-xl bg-emerald-dark p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-light mb-1">
                {isInstallment ? "Bayar Uang Muka" : "Bayar Sekarang"}
              </p>
              <p className="text-2xl font-bold text-ivory tabular-nums leading-tight">{formatRupiah(amountToPayNow)}</p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-12 mt-4 bg-emerald-dark hover:bg-emerald-deep text-ivory rounded-xl font-semibold active:scale-[0.98] transition-all"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
              ) : (
                "Lanjutkan"
              )}
            </Button>
            <p className="text-[11px] text-ivory-ink/50 text-center mt-3">
              Pesanan dibuat setelah kamu menekan Lanjutkan.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Instruksi Pembayaran ────────────────────────────────────────────

function StepInstructions({ order, travel }: { order: CreatedOrder; travel: Tenant | null }) {
  const router = useRouter()
  const isTransfer = order.method === "transfer"
  const bank = order.bank
  const [file, setFile] = useState<File | null>(null)
  const [senderBank, setSenderBank] = useState(bank?.bank_name || "")
  const [senderAccountName, setSenderAccountName] = useState("")
  const [senderAccountNumber, setSenderAccountNumber] = useState("")
  const [transferredAt, setTransferredAt] = useState(new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const legal = (travel?.config as { legal_company?: { office_address?: string; city?: string; office_phone?: string } } | undefined)?.legal_company
  const officeAddress = [legal?.office_address, legal?.city].filter(Boolean).join(", ")

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      setError("Gagal menyalin. Salin manual ya.")
    }
  }

  const submitProof = async () => {
    if (!file) { setError("Unggah bukti transfer terlebih dahulu."); return }
    setSubmitting(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("bookingId", order.bookingId)
      fd.append("senderBank", senderBank)
      fd.append("senderAccountName", senderAccountName)
      fd.append("senderAccountNumber", senderAccountNumber)
      fd.append("transferredAt", transferredAt)
      const res = await fetch("/api/booking/payment-proof", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Gagal mengirim bukti pembayaran.")
        setSubmitting(false)
        return
      }
      router.push(`/dashboard/bookings/${order.bookingId}`)
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.")
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-ivory-card border border-ivory-border rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-dark/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-dark" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-deep">Pesanan tersimpan</h3>
              <p className="text-xs text-ivory-ink/65 mt-0.5">
                Kode pesanan <span className="font-semibold text-emerald-deep">{order.bookingId.slice(0, 8).toUpperCase()}</span> — selesaikan pembayaran agar travel bisa memproses.
              </p>
            </div>
          </div>
        </div>

        {isTransfer ? (
          <>
            <div className="bg-ivory-card border border-ivory-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-dark mb-3">Rekening Tujuan</p>
              {bank ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-dark flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-gold-light" />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-deep">{bank.bank_name}</p>
                      <p className="text-xs text-ivory-ink/60">a.n. {bank.account_holder_name}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-ivory border border-ivory-border p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-ivory-ink/50">Nomor rekening</p>
                      <p className="text-xl font-bold text-emerald-deep tabular-nums tracking-wide">{bank.account_number}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copy(bank.account_number, "rek")}
                      className="gap-1.5 h-10 shrink-0"
                    >
                      {copied === "rek" ? <CheckCircle className="w-4 h-4 text-emerald-dark" /> : <Copy className="w-4 h-4" />}
                      {copied === "rek" ? "Tersalin" : "Salin"}
                    </Button>
                  </div>
                  <div className="rounded-xl bg-emerald-dark p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gold-light">Nominal transfer</p>
                      <p className="text-2xl font-bold text-ivory tabular-nums">{formatRupiah(order.amount)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copy(String(order.amount), "nominal")}
                      className="gap-1.5 h-10 shrink-0 bg-transparent text-ivory border-ivory/30 hover:bg-ivory/10 hover:text-ivory"
                    >
                      {copied === "nominal" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied === "nominal" ? "Tersalin" : "Salin"}
                    </Button>
                  </div>
                  <p className="text-xs text-ivory-ink/60">
                    Transfer sesuai nominal agar verifikasi cepat. Setelah itu unggah bukti transfer di bawah.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-ivory-ink/70">
                  Travel belum menambahkan rekening tujuan. Hubungi travel untuk instruksi pembayaran.
                </p>
              )}
            </div>

            <div className="bg-ivory-card border border-ivory-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <Upload className="w-5 h-5 text-emerald-dark shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-emerald-deep">Kirim Bukti Transfer</h3>
                  <p className="text-xs text-ivory-ink/60 mt-0.5">JPG, PNG, WEBP, atau PDF. Maksimal 5MB.</p>
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                  setError(null)
                  setFile(e.target.files?.[0] || null)
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-emerald-dark/30 bg-emerald-dark/5 px-4 py-6 text-center hover:border-emerald-dark/60 transition-colors cursor-pointer"
              >
                <Upload className="w-6 h-6 text-emerald-dark mx-auto mb-2" />
                <span className="block text-sm font-semibold text-emerald-deep">
                  {file ? file.name : "Pilih file bukti transfer"}
                </span>
                <span className="block text-xs text-ivory-ink/55 mt-0.5">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB — klik untuk ganti` : "Klik untuk memilih dari perangkat"}
                </span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <label className="text-xs font-medium text-ivory-ink/70">
                  Bank pengirim
                  <input
                    value={senderBank}
                    onChange={(e) => setSenderBank(e.target.value)}
                    placeholder="Contoh: BCA"
                    className="mt-1 w-full bg-ivory border border-ivory-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </label>
                <label className="text-xs font-medium text-ivory-ink/70">
                  Nama pemilik rekening
                  <input
                    value={senderAccountName}
                    onChange={(e) => setSenderAccountName(e.target.value)}
                    placeholder="Nama sesuai rekening"
                    className="mt-1 w-full bg-ivory border border-ivory-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </label>
                <label className="text-xs font-medium text-ivory-ink/70">
                  Nomor rekening pengirim
                  <input
                    value={senderAccountNumber}
                    onChange={(e) => setSenderAccountNumber(e.target.value)}
                    inputMode="numeric"
                    placeholder="Opsional"
                    className="mt-1 w-full bg-ivory border border-ivory-border rounded-lg px-3 py-2.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </label>
                <label className="text-xs font-medium text-ivory-ink/70">
                  Tanggal transfer
                  <input
                    type="date"
                    value={transferredAt}
                    onChange={(e) => setTransferredAt(e.target.value)}
                    className="mt-1 w-full bg-ivory border border-ivory-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </label>
              </div>

              {error && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                </p>
              )}

              <Button
                onClick={submitProof}
                disabled={submitting}
                className="w-full h-12 mt-4 bg-emerald-dark hover:bg-emerald-deep text-ivory rounded-xl font-semibold active:scale-[0.98] transition-all"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</> : "Kirim Bukti Pembayaran"}
              </Button>
              <p className="text-[11px] text-ivory-ink/50 text-center mt-3">
                Bukti akan diverifikasi oleh travel. Kamu bisa memantau status di halaman pesanan.
              </p>
            </div>
          </>
        ) : (
          <div className="bg-ivory-card border border-ivory-border rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-dark/10 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 text-emerald-dark" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-deep">Bayar Tunai di Kantor Travel</h3>
                <p className="text-sm text-ivory-ink/65 mt-1">
                  Datang ke kantor {travel?.name || "travel"} dan bayar langsung sebesar:
                </p>
                <p className="text-2xl font-bold text-emerald-deep tabular-nums mt-2">{formatRupiah(order.amount)}</p>
                {officeAddress && (
                  <p className="text-sm text-ivory-ink/70 mt-3">{officeAddress}</p>
                )}
                {legal?.office_phone && (
                  <p className="text-xs text-ivory-ink/60 mt-1">Telepon: {legal.office_phone}</p>
                )}
                <p className="text-xs text-ivory-ink/55 mt-4">
                  Tunjukkan kode pesanan <span className="font-semibold">{order.bookingId.slice(0, 8).toUpperCase()}</span> ke petugas. Travel akan mengonfirmasi pembayaran.
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push(`/dashboard/bookings/${order.bookingId}`)}
              className="w-full h-12 mt-5 bg-emerald-dark hover:bg-emerald-deep text-ivory rounded-xl font-semibold"
            >
              Selesai, Lihat Pesanan
            </Button>
          </div>
        )}

        {isTransfer && (
          <button
            type="button"
            onClick={() => router.push(`/dashboard/bookings/${order.bookingId}`)}
            className="w-full text-center text-xs font-medium text-ivory-ink/55 hover:text-emerald-deep py-1 cursor-pointer"
          >
            Nanti saja, buka halaman pesanan
          </button>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-24">
          <div className="bg-ivory-card border border-ivory-border rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-emerald-deep mb-4">Ringkasan Pembayaran</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ivory-ink/60">Metode</span>
                <span className="font-medium">{order.method === "cash" ? "Tunai" : "Transfer bank"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ivory-ink/60">Tipe</span>
                <span className="font-medium">{order.paymentType === "full" ? "Bayar Penuh" : "Cicilan"}</span>
              </div>
              {order.paymentType === "installment" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-ivory-ink/60">Uang muka</span>
                    <span className="tabular-nums">{formatRupiah(order.dpAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ivory-ink/60">Tenor</span>
                    <span>{order.tenor} bulan</span>
                  </div>
                  <div className="flex justify-between text-ivory-ink/50 text-xs">
                    <span>Sisa dicicil</span>
                    <span className="tabular-nums">{formatRupiah(order.remaining)}</span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 rounded-xl bg-emerald-dark p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-light mb-1">
                {order.method === "cash" ? "Bayar Tunai" : "Transfer Sekarang"}
              </p>
              <p className="text-2xl font-bold text-ivory tabular-nums leading-tight">{formatRupiah(order.amount)}</p>
            </div>
            <div className="mt-4 flex items-start gap-2 text-[11px] text-ivory-ink/55">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Pesanan berstatus menunggu pembayaran sampai travel memverifikasi.</span>
            </div>
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
