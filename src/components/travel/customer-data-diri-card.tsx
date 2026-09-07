"use client"

import { useEffect, useState } from "react"
import { ShieldCheck, AlertTriangle, Bell, CheckCircle2, Loader2, PhoneCall } from "lucide-react"
import { toast } from "sonner"

interface DataDiriResult {
  complete: boolean
  missingFields: string[]
  data: Record<string, string | null | undefined> & {
    address?: Record<string, string | null | undefined>
  }
}

const MARITAL_LABELS: Record<string, string> = {
  "belum-menikah": "Belum Menikah",
  menikah: "Menikah",
  "cerai-hidup": "Cerai Hidup",
  "cerai-mati": "Cerai Mati",
}

function label(v: string | null | undefined, map?: Record<string, string>) {
  if (!v?.trim()) return "-"
  if (map && map[v]) return map[v]
  return v.charAt(0).toUpperCase() + v.slice(1)
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "-"
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

export default function CustomerDataDiriCard({ bookingId }: { bookingId: string }) {
  const [data, setData] = useState<DataDiriResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/api/booking/customer-data-diri?bookingId=${bookingId}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Gagal memuat data diri")
        if (active) setData(json)
      })
      .catch((err) => {
        if (active) setError(err.message || "Terjadi kesalahan")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [bookingId])

  async function sendReminder() {
    setSending(true)
    const res = await fetch("/api/booking/remind-data-diri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    })
    const json = await res.json()
    if (res.ok) {
      setReminderSent(true)
      toast.success("Pengingat berhasil dikirim ke jamaah")
    } else {
      toast.error(json.error || "Gagal mengirim pengingat")
    }
    setSending(false)
  }

  const fullAddress = data?.data?.address
  const addressLine = fullAddress
    ? [fullAddress.street, fullAddress.rt_rw, fullAddress.village, fullAddress.district, fullAddress.city, fullAddress.province, fullAddress.postal_code]
        .filter((x) => x?.trim())
        .join(", ")
    : null

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Data Diri Jamaah
        </h2>
        {!loading && data && (
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              data.complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {data.complete ? "Lengkap" : "Belum Lengkap"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground">{error}</p>
      ) : data ? (
        data.complete ? (
          <div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Jamaah telah melengkapi data diri. Data tercantum di bawah.
            </div>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 text-sm">
              <Field label="Nama" value={data.data.full_name} />
              <Field label="Telepon" value={data.data.phone} />
              <Field label="Email" value={data.data.email} />
              <Field label="NIK" value={data.data.nik} mono />
              <Field label="Jenis Kelamin" value={label(data.data.gender)} />
              <Field label="Tempat, Tanggal Lahir" value={`${label(data.data.birth_place)}, ${fmtDate(data.data.birth_date)}`} />
              <Field label="Nama Ibu Kandung" value={data.data.mother_name} />
              <Field label="Status Kawin" value={label(data.data.marital_status, MARITAL_LABELS)} />
              <Field label="Pekerjaan" value={data.data.occupation} />
              <Field label="No. Paspor" value={data.data.passport_number} mono />
              <Field label="Masa Berlaku Paspor" value={fmtDate(data.data.passport_expiry)} />
              <Field label="Tempat Terbit Paspor" value={data.data.passport_place} />
              <Field label="Tanggal Terbit Paspor" value={fmtDate(data.data.passport_issue_date)} />
              <Field label="Alamat" value={addressLine} />
              <Field label="Kontak Darurat" value={`${label(data.data.emergency_contact_name)} • ${label(data.data.emergency_contact_phone)}`} icon={<PhoneCall className="w-3 h-3 inline mr-1" />} />
            </dl>
          </div>
        ) : (
          <div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 flex items-start gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Jamaah <b>belum melengkapi data diri</b>. Kirim pengingat agar mereka segera mengisinya.
                {data.missingFields.length > 0 && (
                  <span className="block mt-1 text-amber-700/80">{data.missingFields.join(", ")}</span>
                )}
              </span>
            </div>
            {reminderSent ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Pengingat terkirim ke jamaah. Dapat mengirim lagi maksimal 1x per 24 jam.
              </div>
            ) : (
              <button
                onClick={sendReminder}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 transition-colors disabled:opacity-60 shadow-md shadow-emerald-600/25"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                {sending ? "Mengirim..." : "Kirim Pengingat ke Jamaah"}
              </button>
            )}
          </div>
        )
      ) : null}
    </div>
  )
}

function Field({
  label,
  value,
  mono,
  icon,
}: {
  label: string
  value: string | null | undefined
  mono?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <dt className="sm:w-40 shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`font-medium break-words ${mono ? "font-mono text-xs" : ""}`}>
        {icon}
        {value?.trim() ? value : "-"}
      </dd>
    </div>
  )
}