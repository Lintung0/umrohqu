"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Banknote, CheckCircle2, Clock, Landmark, RefreshCcw, ShieldCheck, Wallet, X, XCircle } from "lucide-react"
import { formatRupiah } from "@/lib/constants"

interface ClaimRow {
  id: string
  amount: number
  status: string
  bank_code: string
  account_number: string
  account_holder_name: string
  failure_reason: string | null
  claimed_at: string | null
  disbursed_at: string | null
  iris_reference_no: string | null
}

interface BookingRow {
  id: string
  package_name: string
  package_slug: string
  cashback_amount: number
  status: string
  created_at: string
  claim: ClaimRow | null
}

interface MineResponse {
  data: BookingRow[]
  totals: Record<string, number>
}

const BANK_OPTIONS = [
  { code: "014", name: "BCA" },
  { code: "008", name: "Mandiri" },
  { code: "002", name: "BRI" },
  { code: "009", name: "BNI" },
  { code: "451", name: "BSI" },
  { code: "013", name: "Permata" },
  { code: "022", name: "CIMB Niaga" },
  { code: "200", name: "BTN" },
  { code: "011", name: "Danamon" },
  { code: "016", name: "Maybank" },
]

const STATUS_META: Record<string, { label: string; cls: string; icon: any }> = {
  pending: { label: "Menunggu Review", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", icon: Clock },
  approved: { label: "Disetujui", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", icon: CheckCircle2 },
  paid: { label: "Sudah Dicairkan", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300", icon: Wallet },
  rejected: { label: "Ditolak", cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300", icon: XCircle },
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status]
  if (!meta) return null
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  )
}

export default function CashbackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<BookingRow[]>([])
  const [totals, setTotals] = useState<Record<string, number>>({})
  const [claimFor, setClaimFor] = useState<BookingRow | null>(null)
  const [bankCode, setBankCode] = useState("014")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountHolderName, setAccountHolderName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cashback/requests?mine=1")
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login")
          return
        }
        throw new Error("Gagal memuat data")
      }
      const data: MineResponse = await res.json()
      setRows(data.data || [])
      setTotals(data.totals || {})
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  const openClaim = (b: BookingRow) => {
    setError("")
    setClaimFor(b)
    setBankCode("014")
    setAccountNumber("")
    setAccountHolderName("")
  }

  const submitClaim = async () => {
    if (!claimFor) return
    if (!/^\d{6,20}$/.test(accountNumber)) {
      setError("Nomor rekening harus 6–20 digit angka")
      return
    }
    if (accountHolderName.trim().length < 3) {
      setError("Nama pemilik rekening wajib diisi")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/cashback/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: claimFor.id,
          bankCode,
          accountNumber: accountNumber.trim(),
          accountHolderName: accountHolderName.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengajukan pencairan")
      setClaimFor(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
  }

  const latestNotice: BookingRow | undefined = [...rows]
    .sort((a, b) => (b.claim?.claimed_at || "").localeCompare(a.claim?.claimed_at || ""))
    .find((r) => r.claim)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <RefreshCcw className="mr-2 h-5 w-5 animate-spin" />
        Memuat...
      </div>
    )
  }

  const claimableCount = rows.filter((r) => r.claim === null).length
  const totalClaimable = rows.filter((r) => r.claim === null).reduce((s, r) => s + r.cashback_amount, 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pencairan cashback</h1>
      </div>

      {latestNotice?.claim && (
        <div
          className={`rounded-xl border p-4 text-sm shadow-sm ${
            latestNotice.claim.status === "rejected"
              ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
              : latestNotice.claim.status === "paid"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">
                {latestNotice.claim.status === "rejected"
                  ? "Pengajuan cashback ditolak"
                  : latestNotice.claim.status === "paid"
                    ? "Cashback sudah dicairkan"
                    : latestNotice.claim.status === "approved"
                      ? "Cashback disetujui — siap dicairkan"
                      : "Pengajuan cashback menunggu review"}
              </p>
              <p className="mt-1.5">
                {latestNotice.claim.status === "rejected"
                  ? latestNotice.claim.failure_reason || "Silakan hubungi admin untuk detail alasan."
                  : latestNotice.claim.status === "paid"
                    ? `Cashback ${formatRupiah(Number(latestNotice.claim.amount))} sudah dikirim ke rekening ***${String(latestNotice.claim.account_number).slice(-4)}.`
                    : `Cashback ${formatRupiah(Number(latestNotice.claim.amount))} dari "${latestNotice.package_name}".`}{" "}
                Status saat ini:{" "}
                <StatusBadge status={latestNotice.claim.status} />
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Siap Diajukan", value: `${claimableCount} booking`, sub: formatRupiah(totalClaimable), icon: Landmark },
          { label: "Menunggu Review", value: `${totals.pending || 0} pengajuan`, sub: "", icon: Clock },
          { label: "Disetujui", value: `${totals.approved || 0} pengajuan`, sub: "", icon: CheckCircle2 },
          { label: "Sudah Dicairkan", value: `${totals.paid || 0} pengajuan`, sub: "", icon: Wallet },
        ].map((st) => (
          <div key={st.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{st.label}</p>
              <st.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-bold">{st.value}</p>
            {st.sub ? <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{st.sub}</p> : null}
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-5">
          <h2 className="font-semibold">Pesanan dengan Cashback</h2>
        </div>
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <Banknote className="mx-auto mb-2 h-8 w-8 opacity-50" />
            Belum ada pesanan yang berhak atas cashback. Pesan paket dengan badge Cashback untuk mulai.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/package/${row.package_slug}`}
                    className="font-medium hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
                  >
                    {row.package_name}
                  </Link>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {formatRupiah(row.cashback_amount)} cashback · dibuat{" "}
                    {new Date(row.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {row.claim && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={row.claim.status} />
                      {row.claim.status === "rejected" && row.claim.failure_reason && (
                        <span className="text-xs text-muted-foreground">Alasan: {row.claim.failure_reason}</span>
                      )}
                    </div>
                  )}
                </div>
                {row.claim === null ? (
                  <button
                    onClick={() => openClaim(row)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Ajukan Pencairan
                  </button>
                ) : (
                  <span className="self-start text-xs text-muted-foreground sm:self-center">Sudah diajukan</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {claimFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setClaimFor(null)}>
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Ajukan Pencairan</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {claimFor.package_name} · {formatRupiah(claimFor.cashback_amount)}
                </p>
              </div>
              <button
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                onClick={() => setClaimFor(null)}
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Bank Tujuan</label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {BANK_OPTIONS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nomor Rekening</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="contoh: 1234567890"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Sesuai nama di rekening"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

              <button
                onClick={submitClaim}
                disabled={submitting}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Mengirim..." : "Kirim Pengajuan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}